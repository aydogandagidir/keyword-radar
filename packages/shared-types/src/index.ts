export type MarketplaceId =
  | "amazon-tr"
  | "amazon-global"
  | "trendyol"
  | "hepsiburada"
  | "n11"
  | "alibaba"
  | "aliexpress"
  | "ebay"
  | "etsy"
  | "temu"
  | "walmart";

export type KeywordExpansionMode =
  | "original"
  | "suffix-alpha"
  | "prefix-alpha"
  | "suffix-numeric";

export type KeywordIntent = "informational" | "commercial" | "transactional" | "navigational" | "unknown";

export interface KeywordScore {
  frequencyScore: number;
  longTailScore: number;
  marketplaceCoverageScore: number;
  confidenceScore: number;
  opportunityScore: number;
}

export interface OpportunityScore extends KeywordScore {
  label: "low" | "medium" | "high";
  reasons: string[];
}

export interface KeywordSuggestion {
  keyword: string;
  normalizedKeyword: string;
  marketplace: MarketplaceId;
  source: string;
  position: number;
  bestPosition?: number;
  occurrenceCount?: number;
  expansionCount?: number;
  expansions?: string[];
  expansion?: string;
  collectedAt: string;
  score?: Partial<KeywordScore>;
}

export interface KeywordRun {
  id: string;
  projectId?: string;
  seedKeyword: string;
  marketplaces: MarketplaceId[];
  expansionModes: KeywordExpansionMode[];
  startedAt: string;
  completedAt?: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  suggestions: KeywordSuggestion[];
}

export interface KeywordProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeywordCluster {
  id: string;
  label: string;
  intent: KeywordIntent;
  keywords: string[];
  confidence: number;
}

export interface ClusterKeywordsInput {
  keywords: string[];
  locale?: string;
}

export interface ListingSuggestionInput {
  marketplace: MarketplaceId;
  keywords: string[];
  title?: string;
  locale?: string;
}

export interface ListingSuggestion {
  title: string;
  bulletPoints: string[];
  searchTerms: string[];
  rationale: string;
}

export interface ListingContent {
  marketplace: MarketplaceId;
  title: string;
  description?: string;
  bullets?: string[];
}

export interface ListingGapItem {
  keyword: string;
  normalizedKeyword: string;
  score: number;
  reason: string;
  presentInTitle: boolean;
  presentInBody: boolean;
  occurrenceCount: number;
  opportunityScore: number;
}

export interface ListingGapAnalysis {
  coveredKeywords: ListingGapItem[];
  missingHighValueKeywords: ListingGapItem[];
  titleRecommendations: string[];
  searchTermRecommendations: string[];
}

export interface AiKeywordClusterer {
  clusterKeywords(input: ClusterKeywordsInput): Promise<KeywordCluster[]>;
}

export interface ListingSuggestionGenerator {
  generateMarketplaceListing(input: ListingSuggestionInput): Promise<ListingSuggestion>;
}

export type MarketplaceSearchControl = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

export interface MarketplaceAdapter {
  id: MarketplaceId;
  name: string;
  domains: string[];
  detectPage(locationHref?: string): boolean;
  findSearchInput(root?: Document): MarketplaceSearchControl | null;
  extractSuggestions(root?: Document): Promise<KeywordSuggestion[]>;
  fetchAutocompleteSuggestions?(query: string): Promise<KeywordSuggestion[]>;
  buildSearchUrl(keyword: string): string;
  normalizeKeyword(keyword: string): string;
}
