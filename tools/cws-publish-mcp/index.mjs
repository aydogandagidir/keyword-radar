#!/usr/bin/env node
/**
 * cws-publish-mcp-server
 *
 * A small, local MCP (stdio) server that wraps the Chrome Web Store Publish API
 * so an agent can upload and publish the packaged extension.
 *
 * Credentials are read from environment variables (or a local .env file in this
 * folder). Secrets are NEVER hard-coded or committed.
 *
 * Required env: CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN
 * Optional env: CWS_EXTENSION_ID (needed for status/upload/publish),
 *               CWS_ZIP_PATH (defaults to the repo's release zip)
 *
 * See README.md for how to obtain these and how to register the server.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..", "..");
const DEFAULT_ZIP = resolve(PROJECT_ROOT, "release", "bluedev-marketplace-keyword-radar-cws-0.1.0.zip");

// --- minimal .env loader (this folder only); real env vars take precedence ---
(function loadDotEnv() {
  const envPath = resolve(__dirname, ".env");
  if (!existsSync(envPath)) return;
  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined && key) process.env[key] = val;
  }
})();

// --- Chrome Web Store API endpoints ---
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/chromewebstore/v1.1";
const UPLOAD = "https://www.googleapis.com/upload/chromewebstore/v1.1";

// --- helpers ---
function requireCreds() {
  const missing = ["CWS_CLIENT_ID", "CWS_CLIENT_SECRET", "CWS_REFRESH_TOKEN"].filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Missing credential(s): ${missing.join(", ")}. ` +
        `Set them as environment variables or in tools/cws-publish-mcp/.env (copy from .env.example).`
    );
  }
}

function resolveExtensionId(arg) {
  const id = (arg || process.env.CWS_EXTENSION_ID || "").trim();
  if (!id) {
    throw new Error(
      "No extension id. Pass `extensionId`, or set CWS_EXTENSION_ID in .env. " +
        "For a brand-new item use the cws_create_new_item tool instead."
    );
  }
  return id;
}

function resolveZipPath(arg) {
  const p = (arg || process.env.CWS_ZIP_PATH || "").trim();
  const abs = p ? (isAbsolute(p) ? p : resolve(PROJECT_ROOT, p)) : DEFAULT_ZIP;
  if (!existsSync(abs)) {
    throw new Error(`Package not found: ${abs}. Build it first with: pnpm package:extension`);
  }
  return abs;
}

let cachedToken = null; // { token, expMs }
async function getAccessToken() {
  requireCreds();
  if (cachedToken && cachedToken.expMs > Date.now() + 60_000) return cachedToken.token;
  const body = new URLSearchParams({
    client_id: process.env.CWS_CLIENT_ID,
    client_secret: process.env.CWS_CLIENT_SECRET,
    refresh_token: process.env.CWS_REFRESH_TOKEN,
    grant_type: "refresh_token"
  });
  const res = await fetch(TOKEN_URL, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const detail = data.error_description || data.error || JSON.stringify(data);
    throw new Error(
      `OAuth token exchange failed (HTTP ${res.status}): ${detail}. ` +
        `Check CWS_CLIENT_ID / CWS_CLIENT_SECRET / CWS_REFRESH_TOKEN.`
    );
  }
  cachedToken = { token: data.access_token, expMs: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cachedToken.token;
}

async function authHeaders() {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}`, "x-goog-api-version": "2" };
}

async function apiGetItem(id) {
  const headers = await authHeaders();
  const res = await fetch(`${API}/items/${id}?projection=DRAFT`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Get item failed (HTTP ${res.status}): ${JSON.stringify(data)}`);
  return data;
}

async function apiUpload(id, zipPath) {
  const headers = await authHeaders();
  const bytes = readFileSync(zipPath);
  const url = id ? `${UPLOAD}/items/${id}` : `${UPLOAD}/items`;
  const method = id ? "PUT" : "POST";
  const res = await fetch(url, { method, headers, body: bytes });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status}): ${JSON.stringify(data)}`);
  return data;
}

async function apiPublish(id, target) {
  const headers = await authHeaders();
  const query = target === "trustedTesters" ? "?publishTarget=trustedTesters" : "";
  const res = await fetch(`${API}/items/${id}/publish${query}`, { method: "POST", headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Publish failed (HTTP ${res.status}): ${JSON.stringify(data)}`);
  return data;
}

// --- result formatting + error guard (DRY) ---
function ok(obj) {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}
function guarded(handler) {
  return async (args) => {
    try {
      return ok(await handler(args ?? {}));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
    }
  };
}

// --- server ---
const server = new McpServer({ name: "cws-publish-mcp-server", version: "1.0.0" });

server.registerTool(
  "cws_get_status",
  {
    title: "Get Chrome Web Store item status",
    description:
      "Fetch the current DRAFT status of the extension item (uploadState, crxVersion, item errors). " +
      "Read-only. Uses CWS_EXTENSION_ID unless `extensionId` is provided.",
    inputSchema: {
      extensionId: z.string().min(12).optional().describe("CWS item id; defaults to CWS_EXTENSION_ID env")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  guarded(async ({ extensionId }) => apiGetItem(resolveExtensionId(extensionId)))
);

server.registerTool(
  "cws_upload_package",
  {
    title: "Upload package to an existing item",
    description:
      "Upload a .zip to an EXISTING Chrome Web Store item, creating a new uploaded draft. Does NOT publish. " +
      "Defaults the package to the repo release zip (CWS_ZIP_PATH) and the id to CWS_EXTENSION_ID. " +
      "Returns the upload result, e.g. { uploadState: 'SUCCESS' | 'IN_PROGRESS' | 'FAILURE', itemError: [...] }.",
    inputSchema: {
      zipPath: z.string().optional().describe("Path to the .zip (absolute, or relative to repo root). Defaults to CWS_ZIP_PATH / release zip."),
      extensionId: z.string().min(12).optional().describe("CWS item id; defaults to CWS_EXTENSION_ID env")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
  },
  guarded(async ({ zipPath, extensionId }) => apiUpload(resolveExtensionId(extensionId), resolveZipPath(zipPath)))
);

server.registerTool(
  "cws_create_new_item",
  {
    title: "Create a NEW store item from a package",
    description:
      "Create a brand-new Chrome Web Store item by uploading a .zip (first-time only). " +
      "Returns the new item id — save it as CWS_EXTENSION_ID for future calls. " +
      "NOTE: listing metadata (screenshots, description, category, privacy practices) must still be filled in the " +
      "Developer Dashboard before the item can be published.",
    inputSchema: {
      zipPath: z.string().optional().describe("Path to the .zip; defaults to CWS_ZIP_PATH / release zip.")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
  },
  guarded(async ({ zipPath }) => apiUpload(null, resolveZipPath(zipPath)))
);

server.registerTool(
  "cws_publish",
  {
    title: "Publish the item",
    description:
      "Publish the current draft of the item. target 'default' makes it live to everyone (subject to review); " +
      "'trustedTesters' publishes to your testers only. This changes what users can install — use deliberately. " +
      "Returns the publish status, e.g. { status: ['OK'], statusDetail: [...] }.",
    inputSchema: {
      target: z.enum(["default", "trustedTesters"]).default("default").describe("Publish audience"),
      extensionId: z.string().min(12).optional().describe("CWS item id; defaults to CWS_EXTENSION_ID env")
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
  },
  guarded(async ({ target, extensionId }) => apiPublish(resolveExtensionId(extensionId), target ?? "default"))
);

server.registerTool(
  "cws_upload_and_publish",
  {
    title: "Upload then publish (convenience)",
    description:
      "Upload the .zip to the existing item and, if the upload succeeds, publish it. " +
      "Defaults the package to the release zip and the id to CWS_EXTENSION_ID. " +
      "If the upload does not return uploadState 'SUCCESS', it stops and does NOT publish.",
    inputSchema: {
      zipPath: z.string().optional().describe("Path to the .zip; defaults to CWS_ZIP_PATH / release zip."),
      extensionId: z.string().min(12).optional().describe("CWS item id; defaults to CWS_EXTENSION_ID env"),
      target: z.enum(["default", "trustedTesters"]).default("default").describe("Publish audience")
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
  },
  guarded(async ({ zipPath, extensionId, target }) => {
    const id = resolveExtensionId(extensionId);
    const upload = await apiUpload(id, resolveZipPath(zipPath));
    if (upload.uploadState && upload.uploadState !== "SUCCESS") {
      return { step: "upload", upload, note: "Upload did not succeed; skipped publish." };
    }
    const publish = await apiPublish(id, target ?? "default");
    return { upload, publish };
  })
);

// --- self-test hook: list tools without a transport or credentials ---
if (process.argv.includes("--list-tools")) {
  const names = ["cws_get_status", "cws_upload_package", "cws_create_new_item", "cws_publish", "cws_upload_and_publish"];
  process.stdout.write(names.join("\n") + "\n");
  process.exit(0);
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("cws-publish-mcp-server running (stdio)");
