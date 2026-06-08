import { describe, expect, it } from "vitest";
import { EXPORT_COLUMNS, summarizeSuggestions, toCsv, toXlsxWorkbook } from "@bluedev/export";
import type { KeywordSuggestion } from "@bluedev/shared-types";

const suggestion: KeywordSuggestion = {
  keyword: "celik, termos",
  normalizedKeyword: "celik termos",
  marketplace: "hepsiburada",
  source: "hepsiburada-autocomplete",
  position: 1,
  bestPosition: 1,
  occurrenceCount: 2,
  expansionCount: 2,
  expansions: ["termos", "termos c"],
  collectedAt: "2026-05-06T12:00:00.000Z",
  score: {
    frequencyScore: 50,
    longTailScore: 71,
    marketplaceCoverageScore: 25,
    confidenceScore: 90,
    opportunityScore: 66
  }
};

const secondSuggestion: KeywordSuggestion = {
  keyword: "bebek canta",
  normalizedKeyword: "bebek canta",
  marketplace: "trendyol",
  source: "trendyol-suggestion-api",
  position: 2,
  bestPosition: 2,
  occurrenceCount: 1,
  expansionCount: 1,
  expansions: ["canta"],
  collectedAt: "2026-05-06T12:00:00.000Z",
  score: {
    frequencyScore: 25,
    confidenceScore: 82,
    opportunityScore: 61
  }
};

describe("export formatting", () => {
  it("escapes CSV values and keeps expected columns", () => {
    const csv = toCsv([suggestion]);
    expect(csv.startsWith(EXPORT_COLUMNS.join(","))).toBe(true);
    expect(csv).toContain('"celik, termos"');
    expect(csv).toContain("celik termos");
    expect(csv).toContain("opportunity_score");
    expect(csv).toContain(",71,25,90,66,");
  });

  it("summarizes export metrics from keyword rows", () => {
    const summary = summarizeSuggestions([suggestion, secondSuggestion]);
    expect(summary.keywordCount).toBe(2);
    expect(summary.totalHits).toBe(3);
    expect(summary.queryCount).toBe(3);
    expect(summary.marketplaceCount).toBe(2);
    expect(summary.sources).toEqual(["hepsiburada-autocomplete", "trendyol-suggestion-api"]);
    expect(summary.topScoreKeyword).toBe("celik, termos");
    expect(summary.topHits).toBe(2);
  });

  it("creates an XLSX workbook with summary, keyword, and analysis sheets", () => {
    const workbook = toXlsxWorkbook([suggestion, secondSuggestion]);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Summary", "Keywords", "Analysis"]);

    const summarySheet = workbook.getWorksheet("Summary");
    const summaryRows = summarySheet?.getRows(2, 9) ?? [];
    const summaryValues = new Map(summaryRows.map((row) => [row.getCell(1).value, row.getCell(2).value]));
    expect(summaryValues.get("keywords")).toBe(2);
    expect(summaryValues.get("hits")).toBe(3);
    expect(summaryValues.get("queries")).toBe(3);

    const keywordSheet = workbook.getWorksheet("Keywords");
    expect(keywordSheet?.getRow(1).values).toContain("keyword");
    expect(keywordSheet?.getRow(2).getCell("keyword").value).toBe("celik, termos");
    expect(keywordSheet?.autoFilter).toEqual({ from: "A1", to: "N1" });

    const analysisSheet = workbook.getWorksheet("Analysis");
    expect(analysisSheet?.getRow(1).values).toContain("word");
    expect(analysisSheet?.getRow(1).values).toContain("normalized_keyword");
  });

  it("adds a listing gap sheet when analysis is provided", () => {
    const workbook = toXlsxWorkbook([suggestion], {
      coveredKeywords: [],
      missingHighValueKeywords: [
        {
          keyword: "termos matara",
          normalizedKeyword: "termos matara",
          score: 78,
          reason: "Missing from listing copy.",
          presentInTitle: false,
          presentInBody: false,
          occurrenceCount: 2,
          opportunityScore: 66
        }
      ],
      titleRecommendations: ['Add "termos matara" to the title.'],
      searchTermRecommendations: ["termos matara"]
    });

    expect(workbook.worksheets.map((sheet) => sheet.name)).toContain("Listing Gap");
    expect(workbook.getWorksheet("Listing Gap")?.getRow(2).getCell("keyword").value).toBe("termos matara");
  });
});
