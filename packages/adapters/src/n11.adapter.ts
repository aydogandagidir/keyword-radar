import { normalizeKeyword } from "@bluedev/core";
import type { MarketplaceAdapter } from "@bluedev/shared-types";
import { commonSuggestionSelectors, detectDomain, extractVisibleSuggestions, queryInput } from "./utils";

const domains = ["n11.com", "www.n11.com"];

export const n11Adapter: MarketplaceAdapter = {
  id: "n11",
  name: "n11",
  domains,
  detectPage(locationHref) {
    return detectDomain(domains, locationHref);
  },
  findSearchInput(root) {
    // n11 historically exposes searchData, with placeholder/class fallbacks for frontend revisions.
    return queryInput(root, [
      "input#searchData",
      "input[name='searchData']",
      "input[placeholder*='Ara']",
      "input[placeholder*='ara' i]",
      "input[placeholder*='kategori' i]",
      "input[placeholder*='marka' i]",
      "input[placeholder*='urun' i]",
      "input[placeholder*='ürün' i]",
      "input[aria-label*='arama' i]",
      "input[class*='search' i]"
    ]);
  },
  async extractSuggestions(root) {
    try {
      // Autocomplete markup is fragile; the adapter returns an empty array when the visible list is unavailable.
      const input = n11Adapter.findSearchInput(root);
      return extractVisibleSuggestions(
        "n11",
        root,
        [
          ".autoComplete li",
          ".autocomplete li",
          "[class*='autoComplete' i] li",
          "[class*='autoComplete' i] a",
          "[class*='autoComplete' i] button",
          "[class*='suggestion'] li",
          "[class*='suggestion' i] a",
          "[class*='suggestion' i] button",
          "[class*='suggest' i] li",
          "[class*='suggest' i] a",
          "[class*='suggest' i] button",
          "[class*='search' i] [role='option']",
          "[class*='search' i] li",
          "[class*='search' i] a",
          "[class*='search' i] button",
          "[role='listbox'] [role='option']",
          ...commonSuggestionSelectors
        ],
        "n11-autocomplete",
        { anchor: input, maxDistancePx: 760 }
      );
    } catch {
      return [];
    }
  },
  buildSearchUrl(keyword) {
    return `https://www.n11.com/arama?q=${encodeURIComponent(keyword)}`;
  },
  normalizeKeyword
};
