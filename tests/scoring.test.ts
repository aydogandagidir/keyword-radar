import { describe, expect, it } from "vitest";
import { analyzeListingGap, confidenceScore, longTailScore, marketplaceCoverageScore, opportunityScore } from "@bluedev/scoring";
import type { KeywordSuggestion } from "@bluedev/shared-types";

const suggestions: KeywordSuggestion[] = [
  {
    keyword: "kablosuz kulaklik",
    normalizedKeyword: "kablosuz kulaklik",
    marketplace: "amazon-tr",
    source: "amazon-autocomplete",
    position: 1,
    collectedAt: "2026-05-06T12:00:00.000Z"
  },
  {
    keyword: "kablosuz kulaklik",
    normalizedKeyword: "kablosuz kulaklik",
    marketplace: "trendyol",
    source: "trendyol-autocomplete",
    position: 2,
    collectedAt: "2026-05-06T12:00:00.000Z"
  }
];

describe("scoring", () => {
  it("scores long-tail keywords higher than single-token keywords", () => {
    expect(longTailScore("kablosuz oyuncu kulakligi")).toBeGreaterThan(longTailScore("kulaklik"));
  });

  it("scores marketplace coverage", () => {
    expect(marketplaceCoverageScore("kablosuz kulaklik", suggestions)).toBe(50);
  });

  it("scores confidence by source and position", () => {
    expect(confidenceScore(suggestions[0]!)).toBeGreaterThan(confidenceScore({ source: "dom", position: 8 }));
  });

  it("returns an opportunity score label", () => {
    expect(opportunityScore("kablosuz kulaklik", suggestions).label).toMatch(/low|medium|high/);
  });

  it("finds missing high-value listing keywords", () => {
    const analysis = analyzeListingGap(
      {
        marketplace: "trendyol",
        title: "Bluetooth kulaklik",
        description: "Uzun pil omru"
      },
      [
        ...suggestions,
        {
          keyword: "oyuncu kulakligi",
          normalizedKeyword: "oyuncu kulakligi",
          marketplace: "trendyol",
          source: "trendyol-autocomplete",
          position: 1,
          occurrenceCount: 3,
          collectedAt: "2026-05-06T12:00:00.000Z"
        }
      ]
    );

    expect(analysis.missingHighValueKeywords[0]?.normalizedKeyword).toBe("oyuncu kulakligi");
    expect(analysis.missingHighValueKeywords[0]?.presentInTitle).toBe(false);
    expect(analysis.titleRecommendations[0]).toContain("oyuncu kulakligi");
  });
});
