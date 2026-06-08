import { normalizeKeyword } from "@bluedev/core";
import type { MarketplaceAdapter, MarketplaceId } from "@bluedev/shared-types";
import { commonSearchInputSelectors, commonSuggestionSelectors, detectDomain, extractVisibleSuggestions, queryInput } from "./utils";

interface GenericMarketplaceAdapterConfig {
  id: MarketplaceId;
  name: string;
  domains: string[];
  inputSelectors?: string[];
  suggestionSelectors?: string[];
  searchUrl(keyword: string): string;
  maxDistancePx?: number;
}

export function createGenericMarketplaceAdapter(config: GenericMarketplaceAdapterConfig): MarketplaceAdapter {
  return {
    id: config.id,
    name: config.name,
    domains: config.domains,
    detectPage(locationHref) {
      return detectDomain(config.domains, locationHref);
    },
    findSearchInput(root) {
      return queryInput(root, [...(config.inputSelectors ?? []), ...commonSearchInputSelectors]);
    },
    async extractSuggestions(root) {
      try {
        const searchInput = this.findSearchInput(root);
        return extractVisibleSuggestions(
          config.id,
          root,
          [...(config.suggestionSelectors ?? []), ...commonSuggestionSelectors],
          `${config.id}-autocomplete`,
          { anchor: searchInput, maxDistancePx: config.maxDistancePx ?? 560 }
        );
      } catch {
        return [];
      }
    },
    buildSearchUrl(keyword) {
      return config.searchUrl(keyword);
    },
    normalizeKeyword
  };
}

export const amazonGlobalAdapter = createGenericMarketplaceAdapter({
  id: "amazon-global",
  name: "Amazon",
  domains: [
    "amazon.com",
    "www.amazon.com",
    "amazon.co.uk",
    "www.amazon.co.uk",
    "amazon.de",
    "www.amazon.de",
    "amazon.fr",
    "www.amazon.fr",
    "amazon.it",
    "www.amazon.it",
    "amazon.es",
    "www.amazon.es",
    "amazon.nl",
    "www.amazon.nl",
    "amazon.se",
    "www.amazon.se",
    "amazon.pl",
    "www.amazon.pl",
    "amazon.ca",
    "www.amazon.ca",
    "amazon.com.mx",
    "www.amazon.com.mx",
    "amazon.com.br",
    "www.amazon.com.br",
    "amazon.in",
    "www.amazon.in",
    "amazon.co.jp",
    "www.amazon.co.jp",
    "amazon.com.au",
    "www.amazon.com.au",
    "amazon.sg",
    "www.amazon.sg",
    "amazon.ae",
    "www.amazon.ae",
    "amazon.sa",
    "www.amazon.sa"
  ],
  inputSelectors: ["input#twotabsearchtextbox", "input[name='field-keywords']", ".nav-search-field input[type='text']"],
  suggestionSelectors: [".s-suggestion", ".nav-flyout .s-suggestion", ".autocomplete-results-container [role='option']"],
  searchUrl(keyword) {
    return `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
  }
});

export const alibabaAdapter = createGenericMarketplaceAdapter({
  id: "alibaba",
  name: "Alibaba",
  domains: ["alibaba.com", "www.alibaba.com", "m.alibaba.com", "turkish.alibaba.com", "spanish.alibaba.com", "french.alibaba.com", "german.alibaba.com", "italian.alibaba.com", "portuguese.alibaba.com"],
  inputSelectors: [
    "input[name='SearchText']",
    "input[name='searchText']",
    "input[name='SearchText'][type='text']",
    "input[name='keywords']",
    "input[name='keyword']",
    "input[name='q']",
    "input[id*='search' i]",
    "input[class*='search' i]",
    "textarea[name='SearchText']",
    "textarea[name='searchText']",
    "textarea[name='keywords']",
    "textarea[name='keyword']",
    "textarea[name='q']",
    "textarea[id*='search' i]",
    "textarea[class*='search' i]",
    "[role='search'] input",
    "[role='search'] textarea",
    "form[action*='search' i] input",
    "form[action*='search' i] textarea",
    "form[action*='trade/search' i] input",
    "form[action*='trade/search' i] textarea",
    "input[placeholder*='Ürün' i]",
    "input[placeholder*='urun' i]",
    "input[placeholder*='ara' i]",
    "input[placeholder*='What are you looking for' i]",
    "input[placeholder*='Search products' i]",
    "input[placeholder*='Search' i]",
    "textarea[placeholder*='Ürün' i]",
    "textarea[placeholder*='urun' i]",
    "textarea[placeholder*='ara' i]",
    "textarea[placeholder*='What are you looking for' i]",
    "textarea[placeholder*='Search products' i]",
    "textarea[placeholder*='Search' i]"
  ],
  suggestionSelectors: [
    "[class*='next-suggest' i] li",
    "[class*='next-suggest' i] a",
    "[class*='next-suggest' i] button",
    "[class*='search-suggest' i] li",
    "[class*='search-suggest' i] a",
    "[class*='search-suggest' i] button",
    "[class*='searchbar'] [class*='suggest' i] li",
    "[class*='searchbar'] [class*='suggest' i] a",
    "[class*='searchbar'] [class*='suggest' i] button",
    ".ife-header-search-bar-popup-wrap .popup-item-query",
    ".ife-header-search-bar-popup-wrap .item.association-item",
    ".ife-header-search-bar-popup-wrap .item.brand-item",
    ".ife-header-search-bar-popup-wrap .item.recommend-item",
    ".ife-header-search-bar-popup-wrap a.item",
    ".ife-header-search-bar-popup-wrap button.item",
    ".ife-header-search-bar-popup-wrap .item",
    ".home-search-panel .popup-item-query",
    ".home-search-panel .item",
    "[class*='header-search' i] [class*='popup' i] [class*='item' i]",
    "[class*='search-bar' i] [class*='popup' i] [class*='item' i]",
    "[class*='suggest'] [class*='item' i]",
    "[data-spm*='search-suggest']",
    "[data-spm*='search-suggest'] a",
    "[data-spm*='search-suggest'] button",
    "[role='listbox'] [role='option']"
  ],
  maxDistancePx: 860,
  searchUrl(keyword) {
    return `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(keyword)}`;
  }
});

export const aliexpressAdapter = createGenericMarketplaceAdapter({
  id: "aliexpress",
  name: "AliExpress",
  domains: ["aliexpress.com", "www.aliexpress.com", "aliexpress.us", "www.aliexpress.us"],
  inputSelectors: ["input[name='SearchText']", "input[id*='search' i]", "input[placeholder*='Search' i]"],
  suggestionSelectors: ["[class*='suggestion' i] li", "[class*='search-suggest' i] li", "[role='listbox'] [role='option']"],
  searchUrl(keyword) {
    return `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}`;
  }
});

export const ebayAdapter = createGenericMarketplaceAdapter({
  id: "ebay",
  name: "eBay",
  domains: [
    "ebay.com",
    "www.ebay.com",
    "ebay.co.uk",
    "www.ebay.co.uk",
    "ebay.de",
    "www.ebay.de",
    "ebay.fr",
    "www.ebay.fr",
    "ebay.it",
    "www.ebay.it",
    "ebay.es",
    "www.ebay.es"
  ],
  inputSelectors: ["input#gh-ac", "input[name='_nkw']", "input[aria-label*='Search' i]"],
  suggestionSelectors: ["#ui-id-1 li", ".ghAC_sugg", "[class*='suggestion' i] li"],
  searchUrl(keyword) {
    return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keyword)}`;
  }
});

export const etsyAdapter = createGenericMarketplaceAdapter({
  id: "etsy",
  name: "Etsy",
  domains: ["etsy.com", "www.etsy.com"],
  inputSelectors: ["input#global-enhancements-search-query", "input[name='search_query']", "input[data-id='search-query']"],
  suggestionSelectors: ["[data-id*='search-suggestions'] li", "[class*='search-suggestion' i] li", "[role='listbox'] [role='option']"],
  searchUrl(keyword) {
    return `https://www.etsy.com/search?q=${encodeURIComponent(keyword)}`;
  }
});

export const temuAdapter = createGenericMarketplaceAdapter({
  id: "temu",
  name: "Temu",
  domains: ["temu.com", "www.temu.com"],
  inputSelectors: ["input[placeholder*='Search' i]", "input[type='search']", "input[class*='search' i]"],
  suggestionSelectors: ["[class*='suggest' i] li", "[role='listbox'] [role='option']"],
  searchUrl(keyword) {
    return `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(keyword)}`;
  }
});

export const walmartAdapter = createGenericMarketplaceAdapter({
  id: "walmart",
  name: "Walmart",
  domains: ["walmart.com", "www.walmart.com"],
  inputSelectors: ["input[type='search']", "input[name='q']", "input[aria-label*='Search' i]"],
  suggestionSelectors: ["[data-testid*='suggest' i]", "[class*='typeahead' i] li", "[role='listbox'] [role='option']"],
  searchUrl(keyword) {
    return `https://www.walmart.com/search?q=${encodeURIComponent(keyword)}`;
  }
});
