# Product Specification — Bluedev Marketplace Keyword Radar

## 1. Product summary

Bluedev Marketplace Keyword Radar is a self-contained Chrome Extension that helps e-commerce sellers discover marketplace keyword opportunities from autocomplete suggestions.

Initial marketplace support:

- Amazon.com.tr
- Trendyol
- n11

The MVP focuses on keyword collection, normalization, deduplication, export, local extension run saving, word frequency, marketplace comparison, and deterministic listing gap analysis. Future versions add AI clustering, listing optimization, PPC keyword packs, and richer project views inside the extension.

## 2. Target users

| User segment | Need |
|---|---|
| Marketplace sellers | Find keywords customers actually search |
| E-commerce agencies | Prepare keyword lists for clients |
| Private label teams | Discover product opportunity signals |
| SEO/content teams | Optimize titles and descriptions |
| PPC teams | Build exact/phrase/broad/negative keyword packs |

## 3. Core problem

Turkish marketplace sellers do not have a clean, affordable, multi-marketplace keyword discovery tool covering Trendyol, n11, Amazon.com.tr, and eventually Hepsiburada together.

Global tools are often Amazon-centric and weak for Turkish marketplaces.

## 4. MVP value proposition

"See what customers search across Turkish marketplaces. Collect, compare, export, and analyze keyword suggestions from Amazon.com.tr, Trendyol, and n11 in one browser panel."

## 5. MVP features

| Feature | Priority | Notes |
|---|---:|---|
| Chrome Extension floating panel | P0 | Required |
| Marketplace detection | P0 | Domain-based |
| Adapter architecture | P0 | Required for maintainability |
| Seed keyword input | P0 | Required |
| Keyword expansion a-z | P0 | Required |
| Before/after expansion | P0 | Required |
| Numeric expansion 0-9 | P0 | Required |
| Autocomplete extraction | P0 | User-triggered only |
| Turkish-aware normalization | P0 | Required |
| Deduplication | P0 | Required |
| Keyword result table | P0 | Required |
| CSV export | P0 | Required |
| XLSX export | P0 | Required |
| Word frequency analysis | P1 | Required for MVP quality |
| Marketplace comparison | P1 | Required for differentiation |
| Local extension storage | P1 | Required for saved runs without external setup |
| In-extension saved runs | P1 | Runs should stay accessible without dashboard setup |
| Listing Gap Analyzer | P1 | First differentiating Pro-style workflow |
| AI-ready interfaces | P1 | Placeholder only |
| Privacy/permissions docs | P0 | Chrome Store readiness |

## 6. Out of scope for MVP

- Guaranteed search volume.
- Product sales estimation.
- Aggressive scraping.
- Seller account integration.
- Automated hidden endpoint crawling.
- Paid AI API calls by default.
- Full SaaS billing.
- Team workspace.
- PPC automation.

## 7. Pro v2 roadmap

| Feature | Description |
|---|---|
| AI clustering | Group keywords by intent and product theme |
| Opportunity score | Demand signal + coverage + long-tail + competition proxy |
| Listing generator | Marketplace-specific title and description suggestions |
| PPC keyword packs | Exact, phrase, broad, negative lists |
| Project folders | Save projects by product/category |
| Google Sheets export | Agency workflow |
| Team workspace | Agency/brand collaboration |
| More marketplaces | Hepsiburada, Pazarama, Çiçeksepeti, Etsy |
| Global marketplaces | Amazon global, Alibaba, AliExpress, eBay, Temu, Walmart after permission and UX validation |

## 8. Business positioning

Primary category: **Marketplace SEO & Keyword Intelligence for Turkish Sellers**

Suggested pricing:

| Plan | Monthly price | Content |
|---|---:|---|
| Free | ₺0 | Limited daily collection |
| Starter | ₺299 | Unlimited collection + export |
| Pro | ₺599 | AI clustering + listing suggestions |
| Agency | ₺1.499 | Multi-project + team + bulk export |

## 9. Acceptance criteria

MVP is accepted when:

- Extension loads unpacked in Chrome.
- User can run keyword collection on supported domains.
- Results are normalized, deduped, displayed, and exportable.
- CSV and XLSX exports work.
- Word frequency works.
- Marketplace comparison works.
- Code is modular and adapter-based.
- Tests pass.
- Privacy documentation is included.
