import type { MarketplaceId } from "@bluedev/shared-types";

export const SUPPORTED_MARKETPLACES: Record<MarketplaceId, { name: string; domains: string[] }> = {
  "amazon-tr": {
    name: "Amazon.com.tr",
    domains: ["amazon.com.tr", "www.amazon.com.tr"]
  },
  "amazon-global": {
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
    ]
  },
  trendyol: {
    name: "Trendyol",
    domains: ["trendyol.com", "www.trendyol.com"]
  },
  hepsiburada: {
    name: "Hepsiburada",
    domains: ["hepsiburada.com", "www.hepsiburada.com"]
  },
  n11: {
    name: "n11",
    domains: ["n11.com", "www.n11.com"]
  },
  alibaba: {
    name: "Alibaba",
    domains: ["alibaba.com", "www.alibaba.com"]
  },
  aliexpress: {
    name: "AliExpress",
    domains: ["aliexpress.com", "www.aliexpress.com", "aliexpress.us", "www.aliexpress.us"]
  },
  ebay: {
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
    ]
  },
  etsy: {
    name: "Etsy",
    domains: ["etsy.com", "www.etsy.com"]
  },
  temu: {
    name: "Temu",
    domains: ["temu.com", "www.temu.com"]
  },
  walmart: {
    name: "Walmart",
    domains: ["walmart.com", "www.walmart.com"]
  }
};

export const DEFAULT_THROTTLE_MS = 700;
