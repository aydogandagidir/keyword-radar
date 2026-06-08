import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type ExtensionManifest = {
  permissions?: string[];
  host_permissions?: string[];
  content_scripts?: Array<{ matches?: string[] }>;
  web_accessible_resources?: Array<{ matches?: string[] }>;
};

const manifestPath = join(process.cwd(), "apps", "extension", "manifest.json");
const manifestText = readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(manifestText) as ExtensionManifest;

const allowedHostMatches = [
  "https://amazon.com.tr/*",
  "https://www.amazon.com.tr/*",
  "https://trendyol.com/*",
  "https://www.trendyol.com/*",
  "https://n11.com/*",
  "https://www.n11.com/*"
];

const forbiddenFragments = [
  "https://www.amazon.com/*",
  "https://www.amazon.co.uk/*",
  "https://www.amazon.de/*",
  "https://www.amazon.fr/*",
  "https://www.amazon.it/*",
  "https://www.amazon.es/*",
  "hepsiburada",
  "alibaba",
  "aliexpress",
  "ebay",
  "etsy",
  "temu",
  "walmart",
  "localhost",
  "127.0.0.1",
  "<all_urls>"
];

describe("extension manifest CWS scope", () => {
  it("uses only narrow user-facing permissions", () => {
    expect(manifest.permissions?.sort()).toEqual(["activeTab", "storage"].sort());
  });

  it("limits host permissions to the first Turkish marketplace release scope", () => {
    expect(manifest.host_permissions?.sort()).toEqual([...allowedHostMatches].sort());
  });

  it("limits content script and web resource matches to the same host allowlist", () => {
    const contentScriptMatches = manifest.content_scripts?.flatMap((entry) => entry.matches ?? []) ?? [];
    const webResourceMatches = manifest.web_accessible_resources?.flatMap((entry) => entry.matches ?? []) ?? [];

    expect(new Set(contentScriptMatches)).toEqual(new Set(allowedHostMatches));
    expect(new Set(webResourceMatches)).toEqual(new Set(allowedHostMatches));
  });

  it("does not include global marketplace or local backend hosts", () => {
    for (const fragment of forbiddenFragments) {
      expect(manifestText).not.toContain(fragment);
    }
  });
});
