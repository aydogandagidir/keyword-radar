# cws-publish-mcp-server

A small **local MCP server** (stdio) that wraps the [Chrome Web Store Publish API](https://developer.chrome.com/docs/webstore/using-api)
so an agent (or you) can upload and publish this extension without leaving the editor.

It is intentionally zero-build: a single ESM file, only `@modelcontextprotocol/sdk` + `zod`.

## Tools

| Tool | What it does | Safe? |
| --- | --- | --- |
| `cws_get_status` | Read the item's draft status (uploadState, version, errors). | read-only |
| `cws_upload_package` | Upload the `.zip` to an **existing** item (new draft, no publish). | write |
| `cws_create_new_item` | Create a **brand-new** item from the `.zip`; returns the new id. | write |
| `cws_publish` | Publish the draft (`default` = everyone, `trustedTesters` = testers). | **destructive** |
| `cws_upload_and_publish` | Upload, then publish if the upload succeeded. | **destructive** |

## What this does and does NOT do

- ✅ Automates **package upload** and **publish** (great for version updates).
- ❌ Does **not** set the store listing (screenshots, description, category, privacy
  practices). Those are configured **once, manually**, in the
  [Developer Dashboard](https://chrome.google.com/webstore/devconsole). A new item cannot
  be published until its listing is complete.

## Prerequisites (one-time)

1. A **Chrome Web Store developer account** (one-time \$5 fee).
2. A **Google Cloud project** with the **Chrome Web Store API** enabled.
3. An **OAuth 2.0 client** (type *Desktop app*) → `client_id` + `client_secret`.
4. A **refresh token** for that client (see [appendix](#appendix-getting-a-refresh-token)).
5. The **item id** of your extension (from the dashboard URL) — or create it with
   `cws_create_new_item`.

## Setup

```bash
# 1. From this folder, install deps
cd tools/cws-publish-mcp
npm install

# 2. Configure credentials
cp .env.example .env      # then edit .env and fill in your values
                          # (.env is gitignored — never commit it)

# 3. Smoke-test the server (no credentials needed — only lists tools)
npm run selftest
# → Advertised tools: cws_get_status, cws_upload_package, ...
```

## Register with Claude Code

Add it as a **local** server (config stays on your machine, not committed). The server
loads credentials from the `.env` file in this folder, so no secrets go into the command:

```bash
claude mcp add cws-publish --scope local -- node "tools/cws-publish-mcp/index.mjs"
```

Restart / reconnect, then the `cws_*` tools become available. Verify with:

```bash
claude mcp list
```

## Usage

**Update an existing, already-listed extension** (the common case):

1. Build the package: `pnpm package:extension`
2. `cws_upload_package` → uploads the new zip (uses `CWS_EXTENSION_ID` + release zip).
3. `cws_get_status` → confirm `uploadState: "SUCCESS"`.
4. `cws_publish` → go live. (Or just `cws_upload_and_publish` to do 2 + 4.)

**First-time item creation:**

1. `cws_create_new_item` → returns a new id; save it as `CWS_EXTENSION_ID` in `.env`.
2. In the **Developer Dashboard**, complete the listing (icon, screenshots 1280×800,
   description, category, privacy practices) and submit for review.
3. After approval, future updates use the *update* flow above.

## Appendix: getting a refresh token

If you don't already have one, the easiest way is the helper CLI:

```bash
npx chrome-webstore-upload-keys
```

It walks you through the OAuth consent flow and prints the `refresh_token` for your
`client_id` / `client_secret`. Paste all three into `.env`. (The Chrome Web Store API
scope is `https://www.googleapis.com/auth/chromewebstore`.)

## Security

- Credentials live only in `.env` (gitignored) or your real environment variables.
- Nothing here is committed except source + this README + `.env.example`.
- `cws_publish` / `cws_upload_and_publish` change what users can install — they are marked
  `destructiveHint: true`; use them deliberately.
