# QA Test Plan

## Automated

- Run `pnpm test`.
- Run `pnpm build`.
- Run `pnpm test:e2e` when a headed Chrome session and live marketplace access are available.
- Confirm adapter routing, DOM fallback, export formatting, scoring, normalization, dedupe, word frequency, and backend validation tests pass.

## Manual Extension Smoke

1. Build the extension with `pnpm --filter @bluedev/extension build`.
2. Load `apps/extension/dist` unpacked in Chrome.
3. Open Amazon.com.tr, Trendyol, and n11.
4. Confirm the floating panel appears.
5. Enter `kulaklık`.
6. Collect only a small run.
7. Confirm progress updates and results appear.
8. Export CSV and XLSX.
9. Confirm unsupported pages do not show the panel.
10. Confirm Hepsiburada, Amazon.com, Alibaba, AliExpress, eBay, Etsy, Temu, Walmart, and localhost hosts are not present in `apps/extension/dist/manifest.json`.

## Manual Backend Smoke

The backend is optional developer infrastructure. Normal user QA should stay inside the extension.

1. Start with `pnpm dev:web`.
2. POST a project to `/api/projects`.
3. POST a run to `/api/runs`.
4. POST keyword suggestions to `/api/keywords/bulk`.
5. GET the run by id or list recent runs with `/api/runs?limit=20`.
6. POST listing content and suggestions to `/api/listing-gap`.
7. Open the dashboard and confirm projects, runs, analysis, and listing gap results render.

## Manual Extension Storage Smoke

1. Build and load the extension.
2. Collect a small keyword run.
3. Click Save.
4. Confirm the panel reports a local save without asking for a backend URL.
5. Confirm CSV/XLSX export and Listing Gap analysis still work without starting `pnpm dev:web`.
