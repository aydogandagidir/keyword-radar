# Release Notes

## 0.1.0 MVP

- Added pnpm monorepo with extension, web app, and shared packages.
- Added Manifest V3 Chrome Extension shell.
- Added floating panel for user-initiated keyword collection.
- Added marketplace adapter layer for Amazon.com.tr, Trendyol, Hepsiburada, and n11.
- Added Turkish-aware normalization, expansion, dedupe, word frequency, coverage comparison, and throttling utilities.
- Added CSV and XLSX exports.
- Added deterministic scoring and AI-ready interfaces.
- Added Next.js backend skeleton with Zod validation.
- Added Vitest coverage and release documentation.

## Next Development Slice

- Added JSON-backed local persistence for projects and keyword runs.
- Added run listing API and local dashboard workspace.
- Revised extension Save run flow to store runs in Chrome local storage with no backend URL setup.
- Added deterministic Listing Gap Analyzer for extension and dashboard workflows.
- Added optional Listing Gap worksheet to XLSX exports when analysis is available.

## Chrome Web Store Release Hardening

- Narrowed the first CWS package to Amazon.com.tr, Trendyol, and n11.
- Removed Hepsiburada, global marketplace, and localhost host permissions from the publishable manifest.
- Updated the content-script router so the CWS build only activates on the first-release Turkish marketplaces.
- Added release packaging and store-submission documentation.
