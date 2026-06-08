export { amazonTrAdapter } from "./amazon-tr.adapter";
export {
  alibabaAdapter,
  aliexpressAdapter,
  amazonGlobalAdapter,
  ebayAdapter,
  etsyAdapter,
  temuAdapter,
  walmartAdapter
} from "./generic-marketplace.adapter";
export { trendyolAdapter } from "./trendyol.adapter";
export { hepsiburadaAdapter } from "./hepsiburada.adapter";
export { n11Adapter } from "./n11.adapter";
export {
  cwsMarketplaceAdapters,
  getAdapterById,
  getAdapterForUrl,
  getCwsAdapterForUrl,
  isCwsSupportedMarketplace,
  isSupportedMarketplace,
  marketplaceAdapters
} from "./router";
export type { MarketplaceAdapter } from "@bluedev/shared-types";
