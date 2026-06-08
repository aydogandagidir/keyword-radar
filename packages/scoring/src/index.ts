import { normalizeKeyword } from "@bluedev/core";
import type {
  AiKeywordClusterer,
  KeywordCluster,
  KeywordScore,
  KeywordSuggestion,
  ListingContent,
  ListingGapAnalysis,
  ListingGapItem,
  ListingSuggestion,
  ListingSuggestionGenerator,
  OpportunityScore
} from "@bluedev/shared-types";

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

export function frequencyScore(keyword: string, suggestions: KeywordSuggestion[] = []): number {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    return 0;
  }
  const count = suggestions.filter((suggestion) => normalizeKeyword(suggestion.normalizedKeyword || suggestion.keyword) === normalizedKeyword).length;
  return clampScore(count * 25);
}

export function longTailScore(keyword: string): number {
  const wordCount = normalizeKeyword(keyword).split(" ").filter(Boolean).length;
  if (wordCount <= 1) {
    return 25;
  }
  return clampScore(35 + wordCount * 18);
}

export function marketplaceCoverageScore(keyword: string, suggestions: KeywordSuggestion[], totalMarketplaces = 4): number {
  const normalizedKeyword = normalizeKeyword(keyword);
  const marketplaces = new Set(
    suggestions
      .filter((suggestion) => normalizeKeyword(suggestion.normalizedKeyword || suggestion.keyword) === normalizedKeyword)
      .map((suggestion) => suggestion.marketplace)
  );
  return clampScore((marketplaces.size / Math.max(1, totalMarketplaces)) * 100);
}

export function confidenceScore(suggestion: Pick<KeywordSuggestion, "position" | "source">): number {
  const sourceBoost = suggestion.source.includes("autocomplete") ? 20 : 10;
  const positionScore = Math.max(0, 80 - (suggestion.position - 1) * 8);
  return clampScore(sourceBoost + positionScore);
}

export function opportunityScore(keyword: string, suggestions: KeywordSuggestion[] = []): OpportunityScore {
  const frequency = frequencyScore(keyword, suggestions);
  const longTail = longTailScore(keyword);
  const coverage = marketplaceCoverageScore(keyword, suggestions);
  const confidenceValues = suggestions
    .filter((suggestion) => normalizeKeyword(suggestion.normalizedKeyword || suggestion.keyword) === normalizeKeyword(keyword))
    .map((suggestion) => confidenceScore(suggestion));
  const confidence = confidenceValues.length
    ? confidenceValues.reduce((sum, score) => sum + score, 0) / confidenceValues.length
    : longTail / 2;
  const score = clampScore(frequency * 0.25 + longTail * 0.3 + coverage * 0.25 + confidence * 0.2);

  const reasons = [
    `${normalizeKeyword(keyword).split(" ").filter(Boolean).length} normalized tokens`,
    `${coverage}% marketplace coverage`,
    `${frequency}% repeated suggestion signal`
  ];

  return {
    frequencyScore: frequency,
    longTailScore: longTail,
    marketplaceCoverageScore: coverage,
    confidenceScore: clampScore(confidence),
    opportunityScore: score,
    label: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
    reasons
  };
}

export function scoreSuggestion(suggestion: KeywordSuggestion, suggestions: KeywordSuggestion[]): KeywordScore {
  const score = opportunityScore(suggestion.normalizedKeyword || suggestion.keyword, suggestions);
  return {
    frequencyScore: score.frequencyScore,
    longTailScore: score.longTailScore,
    marketplaceCoverageScore: score.marketplaceCoverageScore,
    confidenceScore: confidenceScore(suggestion),
    opportunityScore: score.opportunityScore
  };
}

export function analyzeListingGap(content: ListingContent, suggestions: KeywordSuggestion[]): ListingGapAnalysis {
  const title = normalizeKeyword(content.title);
  const body = normalizeKeyword([content.description, ...(content.bullets ?? [])].filter(Boolean).join(" "));
  const byKeyword = new Map<string, KeywordSuggestion>();

  for (const suggestion of suggestions) {
    const normalizedKeyword = normalizeKeyword(suggestion.normalizedKeyword || suggestion.keyword);
    if (!normalizedKeyword) {
      continue;
    }

    const existing = byKeyword.get(normalizedKeyword);
    if (!existing || getSuggestionPriority(suggestion) > getSuggestionPriority(existing)) {
      byKeyword.set(normalizedKeyword, suggestion);
    }
  }

  const items = Array.from(byKeyword.values())
    .map((suggestion) => buildListingGapItem(suggestion, suggestions, title, body))
    .sort((left, right) => right.score - left.score || right.occurrenceCount - left.occurrenceCount || left.normalizedKeyword.localeCompare(right.normalizedKeyword));
  const coveredKeywords = items.filter((item) => item.presentInTitle || item.presentInBody);
  const missingHighValueKeywords = items.filter((item) => !item.presentInTitle && !item.presentInBody).slice(0, 12);
  const titleRecommendations = missingHighValueKeywords
    .slice(0, 5)
    .map((item) => `Add "${item.keyword}" to the title or first bullet if it matches the product.`);
  const searchTermRecommendations = missingHighValueKeywords
    .slice(0, 20)
    .map((item) => item.normalizedKeyword);

  return {
    coveredKeywords,
    missingHighValueKeywords,
    titleRecommendations,
    searchTermRecommendations
  };
}

function buildListingGapItem(suggestion: KeywordSuggestion, suggestions: KeywordSuggestion[], normalizedTitle: string, normalizedBody: string): ListingGapItem {
  const keyword = suggestion.keyword;
  const normalizedKeyword = normalizeKeyword(suggestion.normalizedKeyword || keyword);
  const presentInTitle = containsKeyword(normalizedTitle, normalizedKeyword);
  const presentInBody = containsKeyword(normalizedBody, normalizedKeyword);
  const occurrenceCount = suggestion.occurrenceCount ?? 1;
  const opportunity = opportunityScore(normalizedKeyword, suggestions).opportunityScore;
  const coverage = suggestion.score?.marketplaceCoverageScore ?? marketplaceCoverageScore(normalizedKeyword, suggestions);
  const occurrenceSignal = Math.min(100, occurrenceCount * 30);
  const score = clampScore(opportunity * 0.42 + occurrenceSignal * 0.38 + coverage * 0.2 - (presentInTitle ? 18 : 0) - (presentInBody ? 10 : 0));

  return {
    keyword,
    normalizedKeyword,
    score,
    reason: buildGapReason(presentInTitle, presentInBody, occurrenceCount, opportunity),
    presentInTitle,
    presentInBody,
    occurrenceCount,
    opportunityScore: opportunity
  };
}

function containsKeyword(haystack: string, needle: string): boolean {
  if (!haystack || !needle) {
    return false;
  }
  return haystack.includes(needle);
}

function buildGapReason(presentInTitle: boolean, presentInBody: boolean, occurrenceCount: number, opportunity: number): string {
  if (presentInTitle) {
    return `Already in title; keep position strong. Opportunity ${opportunity}, hits ${occurrenceCount}.`;
  }
  if (presentInBody) {
    return `Present in body but missing from title. Opportunity ${opportunity}, hits ${occurrenceCount}.`;
  }
  return `Missing from listing copy. Opportunity ${opportunity}, hits ${occurrenceCount}.`;
}

function getSuggestionPriority(suggestion: KeywordSuggestion): number {
  return (suggestion.score?.opportunityScore ?? 0) * 1000 + (suggestion.occurrenceCount ?? 1) * 20 - (suggestion.bestPosition ?? suggestion.position);
}

export class DeterministicKeywordClusterer implements AiKeywordClusterer {
  async clusterKeywords(input: { keywords: string[]; locale?: string }): Promise<KeywordCluster[]> {
    const groups = new Map<string, string[]>();
    for (const keyword of input.keywords) {
      const normalized = normalizeKeyword(keyword, input.locale);
      const key = normalized.split(" ")[0] ?? "keyword";
      groups.set(key, [...(groups.get(key) ?? []), keyword]);
    }

    return Array.from(groups.entries()).map(([label, keywords], index) => ({
      id: `cluster-${index + 1}`,
      label,
      intent: "unknown",
      keywords,
      confidence: 0.5
    }));
  }
}

export class DeterministicListingSuggestionGenerator implements ListingSuggestionGenerator {
  async generateMarketplaceListing(input: { keywords: string[]; title?: string }): Promise<ListingSuggestion> {
    const searchTerms = input.keywords.map((keyword) => normalizeKeyword(keyword)).filter(Boolean).slice(0, 20);
    return {
      title: input.title ?? searchTerms.slice(0, 3).join(" "),
      bulletPoints: searchTerms.slice(0, 5).map((keyword) => `Includes keyword signal: ${keyword}`),
      searchTerms,
      rationale: "Deterministic placeholder output; no paid AI provider was called."
    };
  }
}
