import { normalizeKeyword } from "@bluedev/core";
import type { MarketplaceAdapter } from "@bluedev/shared-types";
import { detectDomain, extractVisibleSuggestions, queryInput } from "./utils";

const domains = ["trendyol.com", "www.trendyol.com"];

export const trendyolAdapter: MarketplaceAdapter = {
  id: "trendyol",
  name: "Trendyol",
  domains,
  detectPage(locationHref) {
    return detectDomain(domains, locationHref);
  },
  findSearchInput(root) {
    // Trendyol experiments with search input markup; keep ASCII-only semantic fallbacks.
    return queryInput(root, [
      "input[data-testid='suggestion']",
      "input[placeholder*='Arad']",
      "input[placeholder*='Urun' i]",
      "input[placeholder*='urun' i]",
      "input[aria-label*='arama' i]",
      "input[aria-label*='ara' i]",
      "input[class*='search-box']",
      "input[class*='searchBox']",
      "input[class*='search']",
      "input[type='text'][autocomplete='off']"
    ]);
  },
  async extractSuggestions(root) {
    try {
      const searchInput = this.findSearchInput(root);
      // Autocomplete containers are not a public API; read only visible, short suggestion-like text.
      return extractVisibleSuggestions(
        "trendyol",
        root,
        [
          ".suggestion-result",
          "[data-testid*='suggestion']",
          "[data-testid*='autocomplete']",
          "[class*='suggestion'] a",
          "[class*='suggestion'] button",
          "[class*='suggestion'] li",
          "[class*='Suggestion'] a",
          "[class*='Suggestion'] li",
          "[class*='auto-complete'] li",
          "[class*='autocomplete'] li",
          "[class*='autoComplete'] li",
          "[class*='search-suggestion'] li",
          "[role='listbox'] [role='option']",
          "[role='option']"
        ],
        "trendyol-autocomplete",
        { anchor: searchInput, maxDistancePx: 460 }
      );
    } catch {
      return [];
    }
  },
  buildSearchUrl(keyword) {
    return `https://www.trendyol.com/sr?q=${encodeURIComponent(keyword)}`;
  },
  normalizeKeyword
};
