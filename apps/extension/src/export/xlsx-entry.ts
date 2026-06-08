import ExcelJS from "exceljs";
import type { KeywordSuggestion, ListingGapAnalysis } from "@bluedev/shared-types";

type XlsxExporter = {
  downloadXlsx: (suggestions: KeywordSuggestion[], filename?: string, listingGapAnalysis?: ListingGapAnalysis) => Promise<void>;
};

declare global {
  var BluedevKeywordRadarXlsx: XlsxExporter | undefined;
}

const exportColumns = [
  "keyword",
  "normalized_keyword",
  "marketplace",
  "source",
  "position",
  "best_position",
  "occurrence_count",
  "expansion_count",
  "frequency_score",
  "long_tail_score",
  "marketplace_coverage_score",
  "confidence_score",
  "opportunity_score",
  "collected_at"
] as const;

type ExportColumn = (typeof exportColumns)[number];

interface ExportSummary {
  keywordCount: number;
  totalHits: number;
  queryCount: number;
  marketplaceCount: number;
  sources: string[];
  topScoreKeyword?: string;
  topScore?: number;
  topHitsKeyword?: string;
  topHits?: number;
}

function toRow(suggestion: KeywordSuggestion): Record<ExportColumn, string | number | undefined> {
  return {
    keyword: suggestion.keyword,
    normalized_keyword: suggestion.normalizedKeyword,
    marketplace: suggestion.marketplace,
    source: suggestion.source,
    position: suggestion.position,
    best_position: suggestion.bestPosition ?? suggestion.position,
    occurrence_count: suggestion.occurrenceCount ?? 1,
    expansion_count: suggestion.expansionCount,
    frequency_score: suggestion.score?.frequencyScore,
    long_tail_score: suggestion.score?.longTailScore,
    marketplace_coverage_score: suggestion.score?.marketplaceCoverageScore,
    confidence_score: suggestion.score?.confidenceScore,
    opportunity_score: suggestion.score?.opportunityScore,
    collected_at: suggestion.collectedAt
  };
}

export async function downloadXlsx(suggestions: KeywordSuggestion[], filename = "keyword-radar-export.xlsx", listingGapAnalysis?: ListingGapAnalysis): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bluedev Marketplace Keyword Radar";
  workbook.created = new Date();

  const summary = summarizeSuggestions(suggestions);
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "metric", key: "metric", width: 28 },
    { header: "value", key: "value", width: 42 }
  ];
  summarySheet.addRows([
    { metric: "keywords", value: summary.keywordCount },
    { metric: "hits", value: summary.totalHits },
    { metric: "queries", value: summary.queryCount },
    { metric: "marketplaces", value: summary.marketplaceCount },
    { metric: "sources", value: summary.sources.join(", ") },
    { metric: "top_score_keyword", value: summary.topScoreKeyword },
    { metric: "top_score", value: summary.topScore },
    { metric: "top_hits_keyword", value: summary.topHitsKeyword },
    { metric: "top_hits", value: summary.topHits }
  ]);
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.views = [{ state: "frozen", ySplit: 1 }];

  const keywordSheet = workbook.addWorksheet("Keywords");
  keywordSheet.columns = exportColumns.map((column) => ({
    header: column,
    key: column,
    width: column === "keyword" || column === "normalized_keyword" ? 30 : 18
  }));

  for (const suggestion of suggestions) {
    keywordSheet.addRow(toRow(suggestion));
  }

  keywordSheet.getRow(1).font = { bold: true };
  keywordSheet.views = [{ state: "frozen", ySplit: 1 }];
  keywordSheet.autoFilter = {
    from: "A1",
    to: `${String.fromCharCode(64 + exportColumns.length)}1`
  };

  const analysisSheet = workbook.addWorksheet("Analysis");
  analysisSheet.columns = [
    { header: "word", key: "word", width: 24 },
    { header: "count", key: "count", width: 12 },
    { header: "", key: "spacer", width: 4 },
    { header: "normalized_keyword", key: "normalizedKeyword", width: 36 },
    { header: "marketplaces", key: "marketplaces", width: 28 },
    { header: "coverage_count", key: "coverageCount", width: 16 }
  ];
  const words = calculateWordFrequencyForExport(suggestions);
  const coverage = compareCoverageForExport(suggestions);
  const maxRows = Math.max(words.length, coverage.length);
  for (let index = 0; index < maxRows; index += 1) {
    const word = words[index];
    const coverageItem = coverage[index];
    analysisSheet.addRow({
      word: word?.word,
      count: word?.count,
      normalizedKeyword: coverageItem?.normalizedKeyword,
      marketplaces: coverageItem?.marketplaces.join(", "),
      coverageCount: coverageItem?.count
    });
  }
  analysisSheet.getRow(1).font = { bold: true };
  analysisSheet.views = [{ state: "frozen", ySplit: 1 }];

  if (listingGapAnalysis) {
    const gapSheet = workbook.addWorksheet("Listing Gap");
    gapSheet.columns = [
      { header: "keyword", key: "keyword", width: 32 },
      { header: "score", key: "score", width: 12 },
      { header: "opportunity_score", key: "opportunityScore", width: 18 },
      { header: "hits", key: "occurrenceCount", width: 12 },
      { header: "in_title", key: "presentInTitle", width: 12 },
      { header: "in_body", key: "presentInBody", width: 12 },
      { header: "reason", key: "reason", width: 64 }
    ];
    for (const item of listingGapAnalysis.missingHighValueKeywords) {
      gapSheet.addRow(item);
    }
    gapSheet.getRow(1).font = { bold: true };
    gapSheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

globalThis.BluedevKeywordRadarXlsx = { downloadXlsx };

function summarizeSuggestions(suggestions: KeywordSuggestion[]): ExportSummary {
  const querySet = new Set<string>();
  const sources = new Set<string>();
  const marketplaces = new Set<string>();
  let maxExpansionCount = 0;
  let topScoreSuggestion: KeywordSuggestion | undefined;
  let topHitsSuggestion: KeywordSuggestion | undefined;

  for (const suggestion of suggestions) {
    sources.add(suggestion.source);
    marketplaces.add(suggestion.marketplace);
    maxExpansionCount = Math.max(maxExpansionCount, suggestion.expansionCount ?? 0);
    for (const expansion of suggestion.expansions ?? (suggestion.expansion ? [suggestion.expansion] : [])) {
      querySet.add(expansion);
    }

    if (getDisplayScore(suggestion) > getDisplayScore(topScoreSuggestion)) {
      topScoreSuggestion = suggestion;
    }
    if ((suggestion.occurrenceCount ?? 1) > (topHitsSuggestion?.occurrenceCount ?? 0)) {
      topHitsSuggestion = suggestion;
    }
  }

  return {
    keywordCount: suggestions.length,
    totalHits: suggestions.reduce((sum, suggestion) => sum + (suggestion.occurrenceCount ?? 1), 0),
    queryCount: querySet.size || maxExpansionCount,
    marketplaceCount: marketplaces.size,
    sources: Array.from(sources).sort(),
    topScoreKeyword: topScoreSuggestion?.keyword,
    topScore: topScoreSuggestion ? getDisplayScore(topScoreSuggestion) : undefined,
    topHitsKeyword: topHitsSuggestion?.keyword,
    topHits: topHitsSuggestion ? topHitsSuggestion.occurrenceCount ?? 1 : undefined
  };
}

function normalizeExportKeyword(keyword: string): string {
  return keyword
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateWordFrequencyForExport(suggestions: KeywordSuggestion[]): Array<{ word: string; count: number }> {
  const counts = new Map<string, number>();
  for (const suggestion of suggestions) {
    for (const word of normalizeExportKeyword(suggestion.normalizedKeyword || suggestion.keyword).split(" ").filter(Boolean)) {
      counts.set(word, (counts.get(word) ?? 0) + (suggestion.occurrenceCount ?? 1));
    }
  }
  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((left, right) => right.count - left.count || left.word.localeCompare(right.word));
}

function compareCoverageForExport(suggestions: KeywordSuggestion[]): Array<{ normalizedKeyword: string; marketplaces: string[]; count: number }> {
  const coverage = new Map<string, Set<string>>();
  for (const suggestion of suggestions) {
    const keyword = normalizeExportKeyword(suggestion.normalizedKeyword || suggestion.keyword);
    if (!keyword) {
      continue;
    }
    const marketplaces = coverage.get(keyword) ?? new Set<string>();
    marketplaces.add(suggestion.marketplace);
    coverage.set(keyword, marketplaces);
  }
  return Array.from(coverage.entries())
    .map(([normalizedKeyword, marketplaces]) => ({
      normalizedKeyword,
      marketplaces: Array.from(marketplaces).sort(),
      count: marketplaces.size
    }))
    .sort((left, right) => right.count - left.count || left.normalizedKeyword.localeCompare(right.normalizedKeyword));
}

function getDisplayScore(suggestion?: KeywordSuggestion): number {
  return suggestion?.score?.opportunityScore ?? suggestion?.score?.confidenceScore ?? 0;
}
