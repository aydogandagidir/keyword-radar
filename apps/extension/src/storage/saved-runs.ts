import type { KeywordExpansionMode, KeywordRun, KeywordSuggestion, ListingGapAnalysis, MarketplaceId } from "@bluedev/shared-types";

export const savedRunsStorageKey = "bluedev-keyword-radar-saved-runs";
const maxSavedRuns = 20;

export interface SavedKeywordRun extends KeywordRun {
  savedAt: string;
  marketplaceName: string;
  listingGapAnalysis?: ListingGapAnalysis;
}

export interface CreateSavedRunInput {
  seedKeyword: string;
  marketplace: MarketplaceId;
  marketplaceName: string;
  expansionModes: KeywordExpansionMode[];
  suggestions: KeywordSuggestion[];
  listingGapAnalysis?: ListingGapAnalysis | null;
}

export function createSavedKeywordRun(input: CreateSavedRunInput): SavedKeywordRun {
  const now = new Date().toISOString();
  return {
    id: createId("local_run"),
    seedKeyword: input.seedKeyword || "keyword run",
    marketplaces: [input.marketplace],
    expansionModes: input.expansionModes,
    startedAt: now,
    completedAt: now,
    status: "completed",
    suggestions: input.suggestions,
    savedAt: now,
    marketplaceName: input.marketplaceName,
    listingGapAnalysis: input.listingGapAnalysis ?? undefined
  };
}

export function mergeSavedRuns(existingRuns: SavedKeywordRun[], nextRun: SavedKeywordRun, limit = maxSavedRuns): SavedKeywordRun[] {
  return [nextRun, ...existingRuns.filter((run) => run.id !== nextRun.id)]
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
    .slice(0, limit);
}

export async function saveKeywordRunLocally(input: CreateSavedRunInput): Promise<SavedKeywordRun> {
  const nextRun = createSavedKeywordRun(input);
  const existingRuns = await readSavedRuns();
  await chrome.storage.local.set({
    [savedRunsStorageKey]: mergeSavedRuns(existingRuns, nextRun)
  });
  return nextRun;
}

export async function readSavedRuns(): Promise<SavedKeywordRun[]> {
  try {
    const result = await chrome.storage.local.get(savedRunsStorageKey);
    return Array.isArray(result[savedRunsStorageKey]) ? result[savedRunsStorageKey] as SavedKeywordRun[] : [];
  } catch {
    return [];
  }
}

function createId(prefix: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
