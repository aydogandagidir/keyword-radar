# Marketplace Adapters

Marketplace-specific behavior is isolated in `packages/adapters`.

## Contract

Each adapter implements:

- `detectPage(locationHref?: string)`
- `findSearchInput(root?: Document)`
- `extractSuggestions(root?: Document)`
- `buildSearchUrl(keyword: string)`
- `normalizeKeyword(keyword: string)`

## Chrome Web Store Release Scope

- `amazon-tr.adapter.ts`
- `trendyol.adapter.ts`
- `n11.adapter.ts`

These three adapters are the only adapters exposed by the first CWS manifest and content-script router.

## Development Adapters

The repository also contains Hepsiburada and global marketplace adapters for future work. They remain available to unit tests and later product slices, but the first publishable extension package does not request their host permissions or inject content scripts on those hosts.

## Selector Strategy

Adapters use multiple selectors for search inputs and autocomplete lists. Marketplace frontends change often, so selectors are intentionally defensive and extraction returns an empty array instead of throwing when suggestions are unavailable.

## Privacy Boundary

Adapters only inspect public, visible search/autocomplete UI on supported marketplace pages. They must not collect seller account, order, customer, billing, or private panel information.
