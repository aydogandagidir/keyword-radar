# Bluedev Marketplace Keyword Radar

Production-grade MVP for a self-contained Manifest V3 Chrome Extension. The first Chrome Web Store release helps Turkish marketplace sellers collect user-initiated autocomplete keyword suggestions from Amazon.com.tr, Trendyol, and n11.

## What It Does

- Detects supported marketplace pages.
- Injects a floating keyword research panel.
- Expands a seed keyword with original, suffix A-Z, prefix A-Z, and suffix 0-9 modes.
- Captures visible autocomplete suggestions only.
- Normalizes Turkish and English keywords.
- Deduplicates, scores, compares marketplace coverage, and calculates word frequency.
- Exports CSV and XLSX.
- Saves runs inside Chrome local extension storage.
- Analyzes listing gaps by comparing collected keyword signals against title and description copy.
- Provides optional developer-only Zod-validated backend endpoints for projects, runs, bulk keywords, and listing gap analysis.

## Chrome Web Store Scope

The publishable extension package is intentionally narrow:

- Supported sites: Amazon.com.tr, Trendyol, and n11.
- No backend URL, localhost setup, seller account connection, or external API key is exposed to users.
- Saved runs and Listing Gap form state stay in Chrome local extension storage.
- Hepsiburada and global marketplace adapters remain in the codebase for later development, but they are not exposed through the first CWS manifest until their live autocomplete behavior is reliable.

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

## Development

```bash
pnpm dev:extension
pnpm dev:web
pnpm test:e2e
pnpm package:extension
```

## Load The Extension

1. Run `pnpm --filter @bluedev/extension build`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer Mode.
4. Choose Load unpacked.
5. Select `apps/extension/dist`.
6. Open a supported marketplace page and use the floating panel.

## Chrome Web Store Package

```bash
pnpm package:extension
```

The release ZIP is written to `release/bluedev-marketplace-keyword-radar-cws-0.1.0.zip`.

## Optional Developer Backend

- `POST /api/projects`
- `GET /api/projects`
- `POST /api/runs`
- `GET /api/runs/:id`
- `GET /api/runs?projectId=&limit=`
- `POST /api/keywords/bulk`
- `POST /api/listing-gap`

The extension does not require this backend. It stores saved runs in Chrome local storage so users do not manage URLs, localhost services, or external configuration. The optional backend writes to `apps/web/.data/keyword-radar.json` for development and future SaaS work.

## Privacy Boundary

The extension does not collect seller credentials, account details, order data, or private seller panel data. It processes autocomplete suggestions visible to the user on supported marketplace search pages. Optional project/run/keyword storage is controlled by the user.

## Limitations

Marketplace DOM selectors can change. The adapters use fallback selectors and fail closed by returning empty suggestions instead of crashing. Full automated Chrome extension E2E tests are represented by a smoke-test placeholder for this MVP.
