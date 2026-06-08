# Task 04 — Marketplace Adapters

Implement real adapters for:

- Amazon.com.tr
- Trendyol
- Hepsiburada
- n11

Each adapter must:
- detect marketplace page
- find search input using fallback selectors
- extract visible autocomplete suggestions
- build search URL
- normalize keyword

Rules:
- Return empty list instead of throwing when suggestions are unavailable.
- Add comments for fragile selectors.
- Do not collect private user/account/seller/order data.
- Use safe browser-side visible suggestion capture only.

Acceptance criteria:
- Adapters compile.
- Adapter routing tests pass.
- DOM fixture tests cover search input lookup and empty suggestion handling.
