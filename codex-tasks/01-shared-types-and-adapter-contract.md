# Task 01 — Shared Types and Adapter Contract

Create `packages/shared-types` and define all shared types.

Required types:
- MarketplaceId
- KeywordSuggestion
- KeywordRun
- KeywordProject
- KeywordExpansionMode
- KeywordScore
- KeywordCluster
- KeywordIntent
- OpportunityScore
- MarketplaceAdapter

Create `packages/adapters` and add:
- adapter contract
- adapter router
- placeholder adapters for Amazon TR, Trendyol, Hepsiburada, n11

Acceptance criteria:
- Shared types compile.
- Adapter router can select adapter by URL/hostname.
- Tests cover adapter routing.
