import { describe, expect, it } from "vitest";
import {
  calculateWordFrequency,
  compareMarketplaceCoverage,
  dedupeKeywords,
  generateKeywordExpansions,
  normalizeKeyword
} from "@bluedev/core";
import type { KeywordSuggestion } from "@bluedev/shared-types";

const collectedAt = "2026-05-06T12:00:00.000Z";

function suggestion(keyword: string, marketplace: KeywordSuggestion["marketplace"], position = 1): KeywordSuggestion {
  return {
    keyword,
    normalizedKeyword: normalizeKeyword(keyword),
    marketplace,
    source: `${marketplace}-autocomplete`,
    position,
    collectedAt
  };
}

describe("core keyword engine", () => {
  it("normalizes Turkish characters and whitespace", () => {
    expect(normalizeKeyword("  ÇİĞ  Köfte, Şişe!  ")).toBe("cig kofte sise");
    expect(normalizeKeyword("Işıklı Ütü")).toBe("isikli utu");
  });

  it("generates seed, alpha, and numeric expansions", () => {
    const expansions = generateKeywordExpansions("spor ayakkabı", {
      alphabet: ["a", "b"],
      digits: ["0", "1"]
    });
    expect(expansions).toEqual(["spor ayakkabı", "spor ayakkabı a", "spor ayakkabı b", "a spor ayakkabı", "b spor ayakkabı", "spor ayakkabı 0", "spor ayakkabı 1"]);
  });

  it("dedupes by marketplace and normalized keyword", () => {
    const result = dedupeKeywords([
      suggestion("Çanta", "trendyol", 3),
      suggestion(" canta ", "trendyol", 1),
      suggestion("Çanta", "n11", 2)
    ]);
    expect(result).toHaveLength(2);
    expect(result.find((item) => item.marketplace === "trendyol")?.position).toBe(1);
    expect(result.find((item) => item.marketplace === "trendyol")?.occurrenceCount).toBe(2);
  });

  it("calculates word frequency without empty tokens", () => {
    expect(calculateWordFrequency(["çelik termos", "Termos  matara", ""])).toEqual([
      { word: "termos", count: 2 },
      { word: "celik", count: 1 },
      { word: "matara", count: 1 }
    ]);
  });

  it("compares marketplace coverage", () => {
    const coverage = compareMarketplaceCoverage([
      suggestion("kablosuz kulaklık", "amazon-tr"),
      suggestion("Kablosuz Kulaklik", "trendyol"),
      suggestion("telefon kılıfı", "n11")
    ]);
    expect(coverage[0]).toMatchObject({ normalizedKeyword: "kablosuz kulaklik", count: 2 });
  });
});
