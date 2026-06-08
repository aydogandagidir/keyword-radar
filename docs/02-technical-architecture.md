# Technical Architecture

## 1. Architecture principles

1. Adapter-first marketplace support.
2. Shared core keyword engine.
3. Minimal browser permissions.
4. User-triggered collection only.
5. No private marketplace data collection.
6. Strict TypeScript.
7. Testable core functions.
8. AI-ready but not AI-dependent MVP.

## 2. High-level components

```txt
Chrome Extension
  ├─ Content Script
  ├─ Floating Panel UI
  ├─ Background Service Worker
  └─ Marketplace Adapter Router

Shared Packages
  ├─ shared-types
  ├─ adapters
  ├─ core
  ├─ export
  └─ scoring

Backend/Web Skeleton
  ├─ Projects API
  ├─ Runs API
  └─ Keywords API
```

## 3. Data flow

1. User opens a supported marketplace.
2. Content script detects marketplace.
3. Floating panel is injected.
4. User enters seed keyword.
5. Core engine generates expansions.
6. Adapter writes query to search input.
7. Adapter extracts visible suggestions.
8. Core normalizes and dedupes.
9. UI displays table and analysis.
10. User exports CSV/XLSX.
11. Optional backend save for project/run.

## 4. Marketplace adapter contract

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

## 5. Chrome extension boundaries

The extension should never:

- Read seller dashboard private data.
- Read orders.
- Read customer data.
- Read payment data.
- Read account settings.
- Store credentials.
- Send collected data to third parties without user action/consent.

## 6. Backend design

Initial endpoints:

```txt
POST /api/projects
GET  /api/projects
POST /api/runs
GET  /api/runs/:id
POST /api/keywords/bulk
```

Use Zod validation. Keep persistence replaceable.

## 7. Suggested database schema

```sql
users (
  id uuid primary key,
  email text,
  plan text,
  created_at timestamp
);

marketplace_projects (
  id uuid primary key,
  user_id uuid,
  name text,
  seed_keyword text,
  created_at timestamp
);

keyword_runs (
  id uuid primary key,
  project_id uuid,
  marketplace_id text,
  seed_keyword text,
  expansion_mode text,
  status text,
  created_at timestamp
);

keyword_suggestions (
  id uuid primary key,
  run_id uuid,
  marketplace_id text,
  keyword text,
  normalized_keyword text,
  source text,
  position integer,
  frequency_score numeric,
  confidence_score numeric,
  created_at timestamp
);
```
