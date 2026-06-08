import { normalizeKeyword } from "@bluedev/core";
import type { MarketplaceAdapter } from "@bluedev/shared-types";
import { detectDomain, extractVisibleSuggestions, queryInput } from "./utils";

const domains = ["hepsiburada.com", "www.hepsiburada.com"];

export const hepsiburadaAdapter: MarketplaceAdapter = {
  id: "hepsiburada",
  name: "Hepsiburada",
  domains,
  detectPage(locationHref) {
    return detectDomain(domains, locationHref);
  },
  findSearchInput(root) {
    // Hepsiburada search selectors vary by experiment; keep semantic selectors before class-name fallbacks.
    return queryInput(root, [
      "input[type='text'][placeholder*='Ara']",
      "input[aria-label*='ara' i]",
      "input[class*='search']",
      "input[data-test-id*='search']"
    ]);
  },
  async extractSuggestions(root) {
    try {
      // Suggestion selectors are intentionally defensive and only read visible text nodes.
      return extractVisibleSuggestions(
        "hepsiburada",
        root,
        [
          "a[href*='/ara?q=']",
          "a[href*='/arama?q=']",
          "[data-test-id*='suggestion']",
          "[class*='Suggestion'] li",
          "[class*='suggestion'] li",
          "[role='listbox'] [role='option']"
        ],
        "hepsiburada-autocomplete"
      );
    } catch {
      return [];
    }
  },
  buildSearchUrl(keyword) {
    return `https://www.hepsiburada.com/ara?q=${encodeURIComponent(keyword)}`;
  },
  normalizeKeyword
};
