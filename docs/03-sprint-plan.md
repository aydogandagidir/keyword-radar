# Sprint Plan

## Sprint 0 — Project Bootstrap

Goal: Prepare monorepo and development foundation.

Tasks:
- Initialize pnpm workspace.
- Add TypeScript base config.
- Create apps and packages folders.
- Add lint/test/build scripts.
- Add README skeleton.

Exit criteria:
- `pnpm install` works.
- `pnpm build` runs at least empty builds.
- `pnpm test` runs.

## Sprint 1 — Core Engine and Adapter Contract

Goal: Build shared types, adapter interface, and keyword logic.

Tasks:
- Create shared types.
- Implement adapter contract.
- Implement keyword expansion.
- Implement Turkish-aware normalization.
- Implement deduplication.
- Implement word frequency.
- Implement marketplace comparison.
- Add tests.

Exit criteria:
- Core tests pass.
- Adapter router tests pass.

## Sprint 2 — Chrome Extension MVP Shell

Goal: Loadable MV3 extension with panel UI.

Tasks:
- Create manifest.
- Create background service worker.
- Create content script.
- Inject floating panel.
- Add marketplace detection.
- Add seed keyword input.
- Add collect button.

Exit criteria:
- Extension loads unpacked.
- Panel appears on supported domains.
- Unsupported domains do nothing.

## Sprint 3 — Marketplace Adapters and Collection

Goal: Implement Amazon.com.tr, Trendyol, and n11 adapters for the first CWS release; keep Hepsiburada as a development adapter until its autocomplete surface is reliable.

Tasks:
- Implement domain routing.
- Implement search input selectors.
- Implement suggestion extraction fallbacks.
- Implement safe query injection and throttling.
- Add collection progress.
- Add cancel mechanism if feasible.

Exit criteria:
- At least one adapter verified manually.
- Other adapters implemented with graceful fallbacks.
- No crashes when suggestions are absent.

## Sprint 4 — Export, Analysis, Backend Skeleton

Goal: Add CSV/XLSX, word frequency, comparison, backend skeleton.

Tasks:
- Add CSV export.
- Add XLSX export.
- Add word frequency UI.
- Add marketplace comparison UI.
- Add backend API skeleton.
- Add Zod validation.
- Add scoring placeholder.

Exit criteria:
- Exports work.
- Analysis displays.
- Backend starts locally.

## Sprint 5 — QA, Privacy, Release Candidate

Goal: Prepare a shippable MVP.

Tasks:
- Add privacy docs.
- Add permissions docs.
- Add QA checklist.
- Run all tests.
- Build extension.
- Fix critical bugs.
- Prepare release notes.

Exit criteria:
- `pnpm build` passes.
- `pnpm test` passes.
- Manual QA checklist completed.
