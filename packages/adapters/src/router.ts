import type { MarketplaceAdapter, MarketplaceId } from "@bluedev/shared-types";
import { amazonTrAdapter } from "./amazon-tr.adapter";
import {
  alibabaAdapter,
  aliexpressAdapter,
  amazonGlobalAdapter,
  ebayAdapter,
  etsyAdapter,
  temuAdapter,
  walmartAdapter
} from "./generic-marketplace.adapter";
import { hepsiburadaAdapter } from "./hepsiburada.adapter";
import { n11Adapter } from "./n11.adapter";
import { trendyolAdapter } from "./trendyol.adapter";

export const marketplaceAdapters: MarketplaceAdapter[] = [
  amazonTrAdapter,
  amazonGlobalAdapter,
  trendyolAdapter,
  hepsiburadaAdapter,
  n11Adapter,
  alibabaAdapter,
  aliexpressAdapter,
  ebayAdapter,
  etsyAdapter,
  temuAdapter,
  walmartAdapter
];

export const cwsMarketplaceAdapters: MarketplaceAdapter[] = [
  amazonTrAdapter,
  trendyolAdapter,
  hepsiburadaAdapter,
  n11Adapter
];

export function getAdapterById(id: MarketplaceId): MarketplaceAdapter | undefined {
  return marketplaceAdapters.find((adapter) => adapter.id === id);
}

export function getAdapterForUrl(locationHref?: string): MarketplaceAdapter | undefined {
  return marketplaceAdapters.find((adapter) => adapter.detectPage(locationHref));
}

export function getCwsAdapterForUrl(locationHref?: string): MarketplaceAdapter | undefined {
  return cwsMarketplaceAdapters.find((adapter) => adapter.detectPage(locationHref));
}

export function isSupportedMarketplace(locationHref?: string): boolean {
  return Boolean(getAdapterForUrl(locationHref));
}

export function isCwsSupportedMarketplace(locationHref?: string): boolean {
  return Boolean(getCwsAdapterForUrl(locationHref));
}
