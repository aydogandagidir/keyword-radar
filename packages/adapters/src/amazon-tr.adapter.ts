import { normalizeKeyword } from "@bluedev/core";
import type { MarketplaceAdapter } from "@bluedev/shared-types";
import { detectDomain, extractVisibleSuggestions, queryInput } from "./utils";

const domains = ["amazon.com.tr", "www.amazon.com.tr"];

export const amazonTrAdapter: MarketplaceAdapter = {
  id: "amazon-tr",
  name: "Amazon.com.tr",
  domains,
  detectPage(locationHref) {
    return detectDomain(domains, locationHref);
  },
  findSearchInput(root) {
    // Amazon changes autocomplete wrappers frequently; prefer stable input ids and keep broader fallbacks last.
    return queryInput(root, [
      "input#twotabsearchtextbox",
      "input[name='field-keywords']",
      "form[action*='/s'] input[type='text']",
      ".nav-search-field input[type='text']"
    ]);
  },
  async extractSuggestions(root) {
    try {
      // Suggestion class names are marketplace-owned and may change; extraction is visible-text only and fails closed.
      return extractVisibleSuggestions(
        "amazon-tr",
        root,
        [
          ".s-suggestion",
          "[role='listbox'] [role='option']",
          ".autocomplete-results-container [role='option']",
          ".nav-flyout .s-suggestion"
        ],
        "amazon-autocomplete"
      );
    } catch {
      return [];
    }
  },
  buildSearchUrl(keyword) {
    return `https://www.amazon.com.tr/s?k=${encodeURIComponent(keyword)}`;
  },
  normalizeKeyword
};
