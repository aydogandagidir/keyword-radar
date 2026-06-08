# Task 02 — Core Keyword Engine

Create `packages/core`.

Implement:
- generateKeywordExpansions
- normalizeKeyword
- dedupeKeywords
- calculateWordFrequency
- compareMarketplaceCoverage
- sleep
- throttled queue helper

Normalization must support Turkish characters and whitespace cleanup.

Expansion modes:
- original
- suffix alphabet: keyword + a-z
- prefix alphabet: a-z + keyword
- suffix numeric: keyword + 0-9

Acceptance criteria:
- Unit tests pass.
- Dedupe handles case, whitespace, Turkish variants.
- Word frequency ignores empty tokens.
