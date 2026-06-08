#!/usr/bin/env node
/**
 * Headless smoke test: spawns the server, performs the MCP handshake over stdio,
 * and prints the advertised tool names. Requires NO credentials (tools/list does
 * not call the Chrome Web Store API). Exits non-zero if no tools are listed.
 */
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const child = spawn(process.execPath, [resolve(here, "index.mjs")], { stdio: ["pipe", "pipe", "inherit"] });

const send = (obj) => child.stdin.write(JSON.stringify(obj) + "\n");
let buffer = "";

const timer = setTimeout(() => {
  console.error("selftest: timed out waiting for tools/list");
  child.kill();
  process.exit(1);
}, 10_000);

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    if (msg.id === 1) {
      send({ jsonrpc: "2.0", method: "notifications/initialized" });
      send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    } else if (msg.id === 2) {
      clearTimeout(timer);
      const names = (msg.result?.tools ?? []).map((t) => t.name);
      console.log("Advertised tools: " + names.join(", "));
      child.kill();
      process.exit(names.length >= 5 ? 0 : 1);
    }
  }
});

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "selftest", version: "1.0.0" } }
});
