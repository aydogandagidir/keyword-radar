import type { KeywordExpansionMode, KeywordSuggestion, MarketplaceId } from "@bluedev/shared-types";

const DEFAULT_ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
const DEFAULT_DIGITS = "0123456789".split("");
const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u"
};

export interface GenerateKeywordExpansionOptions {
  modes?: KeywordExpansionMode[];
  alphabet?: string[];
  digits?: string[];
}

export interface MarketplaceCoverage {
  normalizedKeyword: string;
  keyword: string;
  marketplaces: MarketplaceId[];
  count: number;
}

export interface ThrottledQueueOptions {
  intervalMs?: number;
  signal?: AbortSignal;
}

export interface CollectionPlanItem {
  query: string;
  mode: KeywordExpansionMode;
}

export interface KeywordCollectionOptions {
  seed: string;
  modes?: KeywordExpansionMode[];
  throttleMs?: number;
}

export function normalizeKeyword(keyword: string, locale = "tr-TR"): string {
  const lower = keyword
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase(locale)
    .replace(/[\u0300-\u036f]/g, "");

  return lower
    .split("")
    .map((char) => TURKISH_CHAR_MAP[char] ?? char)
    .join("")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateKeywordExpansions(seed: string, options: GenerateKeywordExpansionOptions = {}): string[] {
  const normalizedSeed = seed.trim().replace(/\s+/g, " ");
  if (!normalizedSeed) {
    return [];
  }

  const modes = options.modes ?? ["original", "suffix-alpha", "prefix-alpha", "suffix-numeric"];
  const alphabet = options.alphabet ?? DEFAULT_ALPHABET;
  const digits = options.digits ?? DEFAULT_DIGITS;
  const expansions: string[] = [];

  if (modes.includes("original")) {
    expansions.push(normalizedSeed);
  }

  if (modes.includes("suffix-alpha")) {
    expansions.push(...alphabet.map((letter) => `${normalizedSeed} ${letter}`));
  }

  if (modes.includes("prefix-alpha")) {
    expansions.push(...alphabet.map((letter) => `${letter} ${normalizedSeed}`));
  }

  if (modes.includes("suffix-numeric")) {
    expansions.push(...digits.map((digit) => `${normalizedSeed} ${digit}`));
  }

  return Array.from(new Map(expansions.map((item) => [normalizeKeyword(item), item])).values());
}

export function buildCollectionPlan(options: KeywordCollectionOptions): CollectionPlanItem[] {
  const modes = options.modes ?? ["original", "suffix-alpha", "prefix-alpha", "suffix-numeric"];
  return generateKeywordExpansions(options.seed, { modes }).map((query) => {
    if (query === options.seed.trim().replace(/\s+/g, " ")) {
      return { query, mode: "original" };
    }
    if (/\s[0-9]$/.test(query)) {
      return { query, mode: "suffix-numeric" };
    }
    if (/^[a-z]\s/i.test(query)) {
      return { query, mode: "prefix-alpha" };
    }
    return { query, mode: "suffix-alpha" };
  });
}

export function dedupeKeywords(suggestions: KeywordSuggestion[]): KeywordSuggestion[] {
  const byMarketplaceAndKeyword = new Map<string, KeywordSuggestion>();

  for (const suggestion of suggestions) {
    const normalizedKeyword = normalizeKeyword(suggestion.normalizedKeyword || suggestion.keyword);
    if (!normalizedKeyword) {
      continue;
    }

    const key = `${suggestion.marketplace}:${normalizedKeyword}`;
    const existing = byMarketplaceAndKeyword.get(key);
    const normalizedSuggestion: KeywordSuggestion = {
      ...suggestion,
      normalizedKeyword,
      bestPosition: suggestion.bestPosition ?? suggestion.position,
      occurrenceCount: suggestion.occurrenceCount ?? 1,
      expansionCount: suggestion.expansion ? 1 : suggestion.expansionCount,
      expansions: suggestion.expansion ? [suggestion.expansion] : suggestion.expansions
    };

    if (!existing) {
      byMarketplaceAndKeyword.set(key, normalizedSuggestion);
      continue;
    }

    const expansions = new Set([...(existing.expansions ?? []), ...(normalizedSuggestion.expansions ?? [])]);
    const nextPosition = Math.min(existing.position, normalizedSuggestion.position);
    const preferred = normalizedSuggestion.position < existing.position ? normalizedSuggestion : existing;
    byMarketplaceAndKeyword.set(key, {
      ...preferred,
      normalizedKeyword,
      position: nextPosition,
      bestPosition: Math.min(existing.bestPosition ?? existing.position, normalizedSuggestion.bestPosition ?? normalizedSuggestion.position),
      occurrenceCount: (existing.occurrenceCount ?? 1) + (normalizedSuggestion.occurrenceCount ?? 1),
      expansionCount: expansions.size || undefined,
      expansions: expansions.size ? Array.from(expansions) : undefined
    });
  }

  return Array.from(byMarketplaceAndKeyword.values()).sort((a, b) => {
    const marketplaceSort = a.marketplace.localeCompare(b.marketplace);
    if (marketplaceSort !== 0) {
      return marketplaceSort;
    }
    const occurrenceSort = (b.occurrenceCount ?? 1) - (a.occurrenceCount ?? 1);
    if (occurrenceSort !== 0) {
      return occurrenceSort;
    }

    return (a.bestPosition ?? a.position) - (b.bestPosition ?? b.position) || a.normalizedKeyword.localeCompare(b.normalizedKeyword);
  });
}

export function calculateWordFrequency(keywords: Array<string | KeywordSuggestion>): Array<{ word: string; count: number }> {
  const counts = new Map<string, number>();

  for (const item of keywords) {
    const keyword = typeof item === "string" ? item : item.normalizedKeyword || item.keyword;
    const words = normalizeKeyword(keyword).split(" ").filter(Boolean);
    for (const word of words) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}

export function compareMarketplaceCoverage(suggestions: KeywordSuggestion[]): MarketplaceCoverage[] {
  const coverage = new Map<string, { keyword: string; marketplaces: Set<MarketplaceId> }>();

  for (const suggestion of suggestions) {
    const normalizedKeyword = normalizeKeyword(suggestion.normalizedKeyword || suggestion.keyword);
    if (!normalizedKeyword) {
      continue;
    }

    const item = coverage.get(normalizedKeyword) ?? {
      keyword: suggestion.keyword,
      marketplaces: new Set<MarketplaceId>()
    };
    item.marketplaces.add(suggestion.marketplace);
    coverage.set(normalizedKeyword, item);
  }

  return Array.from(coverage.entries())
    .map(([normalizedKeyword, value]) => ({
      normalizedKeyword,
      keyword: value.keyword,
      marketplaces: Array.from(value.marketplaces).sort(),
      count: value.marketplaces.size
    }))
    .sort((a, b) => b.count - a.count || a.normalizedKeyword.localeCompare(b.normalizedKeyword));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, Math.max(0, ms));
  });
}

export function createThrottledQueue(options: ThrottledQueueOptions = {}) {
  const intervalMs = options.intervalMs ?? 700;
  let chain = Promise.resolve();

  return {
    add<T>(task: () => Promise<T>): Promise<T> {
      const run = chain.then(async () => {
        if (options.signal?.aborted) {
          throw new DOMException("Collection was aborted", "AbortError");
        }
        const result = await task();
        await sleep(intervalMs);
        return result;
      });
      chain = run.then(
        () => undefined,
        () => undefined
      );
      return run;
    },
    onIdle(): Promise<void> {
      return chain;
    }
  };
}
