import { describe, expect, it } from "vitest";
import { createSavedKeywordRun, mergeSavedRuns } from "../apps/extension/src/storage/saved-runs";

const suggestion = {
  keyword: "telefon kilifi",
  normalizedKeyword: "telefon kilifi",
  marketplace: "trendyol" as const,
  source: "trendyol-autocomplete",
  position: 1,
  collectedAt: "2026-05-06T12:00:00.000Z"
};

describe("extension saved runs", () => {
  it("creates a completed local run snapshot", () => {
    const run = createSavedKeywordRun({
      seedKeyword: "telefon",
      marketplace: "trendyol",
      marketplaceName: "Trendyol",
      expansionModes: ["original"],
      suggestions: [suggestion]
    });

    expect(run.status).toBe("completed");
    expect(run.marketplaceName).toBe("Trendyol");
    expect(run.suggestions).toHaveLength(1);
    expect(run.id).toBeTruthy();
  });

  it("keeps only the newest saved runs", () => {
    const existing = Array.from({ length: 25 }, (_, index) => ({
      ...createSavedKeywordRun({
        seedKeyword: `seed ${index}`,
        marketplace: "trendyol",
        marketplaceName: "Trendyol",
        expansionModes: ["original"],
        suggestions: [suggestion]
      }),
      savedAt: `2026-05-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`
    }));
    const next = {
      ...createSavedKeywordRun({
        seedKeyword: "new seed",
        marketplace: "n11",
        marketplaceName: "n11",
        expansionModes: ["original"],
        suggestions: [suggestion]
      }),
      savedAt: "2026-06-01T12:00:00.000Z"
    };

    const merged = mergeSavedRuns(existing, next);
    expect(merged).toHaveLength(20);
    expect(merged[0]?.seedKeyword).toBe("new seed");
    expect(merged.at(-1)?.seedKeyword).toBe("seed 6");
  });
});
