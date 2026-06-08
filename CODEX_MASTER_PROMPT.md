# CODEX MASTER PROMPT — Bluedev Marketplace Keyword Radar

You are a senior full-stack TypeScript engineer, Chrome Extension architect, and product-minded technical lead.

Your task is to build a production-grade MVP for **Bluedev Marketplace Keyword Radar**.

This product is a Manifest V3 Chrome Extension plus a lightweight backend/web dashboard skeleton. It helps marketplace sellers discover keyword opportunities from autocomplete suggestions on:

- Amazon.com.tr
- Trendyol
- Hepsiburada
- n11

The MVP must be reliable, maintainable, adapter-based, privacy-conscious, and ready for future AI-powered keyword clustering.

---

## 1. Product goal

Create a Chrome Extension that appears on supported marketplace search pages and lets the user:

1. Enter a seed keyword.
2. Collect autocomplete suggestions using safe, user-initiated query expansion.
3. Expand keyword queries using:
   - original keyword
   - keyword + a-z
   - a-z + keyword
   - keyword + 0-9
4. Normalize Turkish and English keywords.
5. Deduplicate suggestions.
6. Show results in a floating side panel.
7. Show marketplace, source, position, normalized keyword, and scoring signals.
8. Compare keyword availability across marketplaces.
9. Copy results to clipboard.
10. Export results as CSV.
11. Export results as XLSX.
12. Show basic word frequency analysis.
13. Persist optional project/run/keyword data through a lightweight backend skeleton.
14. Prepare the architecture for future AI clustering and opportunity scoring.

---

## 2. Non-negotiable engineering rules

- Use TypeScript everywhere.
- Use strict TypeScript settings.
- Use Manifest V3 for the Chrome Extension.
- Use React + Vite for extension UI.
- Use a monorepo structure with apps and packages.
- Marketplace-specific logic must be isolated in marketplace adapters.
- UI components must not directly contain marketplace extraction logic.
- Core keyword logic must be shared and tested.
- Use safe throttling between query expansions.
- Do not implement aggressive scraping.
- Do not collect private marketplace account data.
- Do not require seller credentials.
- Do not store sensitive data.
- Keep Chrome permissions minimal and justified.
- Add unit tests for all critical core functions.
- Add clear README and privacy/permissions docs.
- Build must work locally.

---

## 3. Required monorepo structure

Create the project with this structure:

```txt
bluedev-marketplace-keyword-radar/
├─ apps/
│  ├─ extension/
│  │  ├─ manifest.json
│  │  ├─ package.json
│  │  ├─ vite.config.ts
│  │  ├─ tsconfig.json
│  │  └─ src/
│  │     ├─ background/
│  │     ├─ content/
│  │     ├─ panel/
│  │     ├─ popup/
│  │     ├─ messaging/
│  │     └─ styles/
│  └─ web/
│     ├─ package.json
│     ├─ next.config.js
│     ├─ tsconfig.json
│     └─ src/
│        ├─ app/
│        ├─ api/
│        └─ lib/
├─ packages/
│  ├─ shared-types/
│  ├─ adapters/
│  ├─ core/
│  ├─ export/
│  ├─ scoring/
│  └─ config/
├─ docs/
├─ tests/
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ README.md
```

---

## 4. Package responsibilities

### packages/shared-types

Must contain shared TypeScript types:

- `MarketplaceId`
- `KeywordSuggestion`
- `KeywordRun`
- `KeywordProject`
- `MarketplaceAdapter`
- `KeywordExpansionMode`
- `KeywordScore`
- `KeywordCluster`
- `KeywordIntent`
- `OpportunityScore`

### packages/adapters

Must contain marketplace adapters:

- `amazon-tr.adapter.ts`
- `trendyol.adapter.ts`
- `hepsiburada.adapter.ts`
- `n11.adapter.ts`
- `router.ts`
- `index.ts`

Each adapter must implement this contract:

```ts
export interface MarketplaceAdapter {
  id: MarketplaceId;
  name: string;
  domains: string[];
  detectPage(locationHref?: string): boolean;
  findSearchInput(root?: Document): HTMLInputElement | null;
  extractSuggestions(root?: Document): Promise<KeywordSuggestion[]>;
  buildSearchUrl(keyword: string): string;
  normalizeKeyword(keyword: string): string;
}
```

Adapter rules:

- Use multiple fallback selectors.
- Avoid hard-coded brittle assumptions where possible.
- Add comments where selector fragility is expected.
- If suggestions cannot be extracted, return an empty array; do not crash.
- Do not collect account information, order information, seller panel data, or private user data.

### packages/core

Must contain:

- keyword expansion
- Turkish-aware normalization
- deduplication
- word frequency
- marketplace comparison
- throttling utilities
- collection orchestration

Functions:

- `generateKeywordExpansions(seed, options)`
- `normalizeKeyword(keyword, locale)`
- `dedupeKeywords(suggestions)`
- `calculateWordFrequency(keywords)`
- `compareMarketplaceCoverage(suggestions)`
- `sleep(ms)`
- `createThrottledQueue()`

### packages/export

Must contain:

- `toCsv()`
- `downloadCsv()`
- `toXlsxWorkbook()`
- `downloadXlsx()`

Use ExcelJS for XLSX.

### packages/scoring

Must contain MVP-safe local scoring:

- `frequencyScore`
- `longTailScore`
- `marketplaceCoverageScore`
- `confidenceScore`
- `opportunityScore`

Do not call paid AI APIs by default. Add optional interface for future AI provider.

---

## 5. Chrome Extension requirements

Use Manifest V3.

Recommended permissions:

- `activeTab`
- `storage`
- `scripting` only if truly needed

Host permissions:

- `https://www.amazon.com.tr/*`
- `https://www.trendyol.com/*`
- `https://www.hepsiburada.com/*`
- `https://www.n11.com/*`

Extension behavior:

1. Detect marketplace from hostname.
2. Inject a floating panel.
3. Let user enter seed keyword.
4. Generate keyword expansions.
5. Populate marketplace search input safely.
6. Trigger autocomplete events.
7. Wait with throttle.
8. Extract visible suggestions.
9. Normalize, dedupe, analyze, and export.
10. Avoid uncontrolled crawling.

---

## 6. Backend skeleton requirements

Create a minimal Next.js or Fastify backend. Prefer Next.js if faster for monorepo.

Required endpoints:

- `POST /api/projects`
- `GET /api/projects`
- `POST /api/runs`
- `GET /api/runs/:id`
- `POST /api/keywords/bulk`

Use Zod validation.

MVP may use in-memory storage or SQLite if database setup would slow the initial version, but the schema and abstractions must be PostgreSQL-ready.

---

## 7. AI-ready requirements

Add types and interfaces for future AI:

```ts
export interface AiKeywordClusterer {
  clusterKeywords(input: ClusterKeywordsInput): Promise<KeywordCluster[]>;
}

export interface ListingSuggestionGenerator {
  generateMarketplaceListing(input: ListingSuggestionInput): Promise<ListingSuggestion>;
}
```

Do not call OpenAI or other paid AI providers unless `OPENAI_API_KEY` or equivalent environment variable exists. For MVP, implement deterministic placeholder logic.

---

## 8. Test requirements

Add tests for:

- Turkish keyword normalization
- deduplication
- keyword expansion generation
- word frequency
- scoring
- marketplace adapter routing
- export formatting

Use Vitest.

Add Playwright smoke test placeholders for extension UI if full browser extension testing is too heavy.

---

## 9. Documentation requirements

Create:

- `README.md`
- `docs/privacy.md`
- `docs/permissions.md`
- `docs/marketplace-adapters.md`
- `docs/release-checklist.md`
- `docs/qa-test-plan.md`
- `docs/known-limitations.md`

Privacy documentation must clearly state:

- No private seller data is collected.
- No account credentials are collected.
- Autocomplete suggestions visible to the user are processed.
- Data storage is limited to keyword projects/runs if user chooses to save.

---

## 10. Acceptance criteria

The task is complete only if:

- `pnpm install` works.
- `pnpm build` works.
- `pnpm test` works.
- Extension can be loaded unpacked in Chrome.
- Supported marketplaces are detected.
- User can collect keyword suggestions from at least one marketplace with a robust adapter demo.
- Other adapters have implemented selectors and safe fallbacks.
- CSV export works.
- XLSX export works.
- Word frequency works.
- Marketplace comparison works.
- README explains setup and Chrome loading.
- Privacy and permission docs are present.
- No private account data collection exists.
- Code is modular and maintainable.

---

## 11. Implementation order

Follow the task files in `codex-tasks/` in numeric order.

This is not just an Amazon clone. This is a Turkish marketplace SEO and keyword intelligence tool for sellers, agencies, and e-commerce teams.
