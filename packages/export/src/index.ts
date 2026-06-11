import ExcelJS from "exceljs";
import type { KeywordSuggestion, ListingGapAnalysis } from "@bluedev/shared-types";

export const EXPORT_COLUMNS = [
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

export type ExportColumn = (typeof EXPORT_COLUMNS)[number];

export interface ExportSummary {
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

// ─── Brand palette (ARGB) ───────────────────────────────────────────────────
const C = {
  brand: "FF15327A",
  brandBright: "FF1B4DFF",
  ink: "FF0A1E66",
  white: "FFFFFFFF",
  band: "FFF4F8FF",
  card: "FFEFF4FF",
  cardBorder: "FFD6E2FA",
  gray: "FF64748B",
  grid: "FFE2E8F0",
  green: "FF16A34A",
  amber: "FFF59E0B",
  red: "FFE11D48"
} as const;

const FRIENDLY_HEADERS: Record<ExportColumn, string> = {
  keyword: "Keyword",
  normalized_keyword: "Normalized",
  marketplace: "Marketplace",
  source: "Source",
  position: "Position",
  best_position: "Best #",
  occurrence_count: "Hits",
  expansion_count: "Expansions",
  frequency_score: "Frequency",
  long_tail_score: "Long-tail",
  marketplace_coverage_score: "Coverage",
  confidence_score: "Confidence",
  opportunity_score: "Opportunity",
  collected_at: "Collected At"
};

const SCORE_COLUMNS = new Set<ExportColumn>([
  "frequency_score",
  "long_tail_score",
  "marketplace_coverage_score",
  "confidence_score",
  "opportunity_score"
]);

function csvEscape(value: unknown): string {
  const raw = value == null ? "" : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, "\"\"")}"`;
  }
  return raw;
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

export function summarizeSuggestions(suggestions: KeywordSuggestion[]): ExportSummary {
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

export function toCsv(suggestions: KeywordSuggestion[]): string {
  const header = EXPORT_COLUMNS.join(",");
  const body = suggestions.map((suggestion) => {
    const row = toRow(suggestion);
    return EXPORT_COLUMNS.map((column) => csvEscape(row[column])).join(",");
  });
  return [header, ...body].join("\r\n");
}

export function downloadCsv(suggestions: KeywordSuggestion[], filename = "keyword-radar-export.csv"): void {
  const blob = new Blob(["﻿", toCsv(suggestions)], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}

// ─── Styling helpers ────────────────────────────────────────────────────────
function fill(cell: ExcelJS.Cell, argb: string): void {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function box(cell: ExcelJS.Cell, argb: string = C.grid): void {
  const side = { style: "thin" as const, color: { argb } };
  cell.border = { top: side, left: side, bottom: side, right: side };
}

function styleHeaderRow(row: ExcelJS.Row, columnCount: number): void {
  row.height = 22;
  for (let column = 1; column <= columnCount; column += 1) {
    const cell = row.getCell(column);
    fill(cell, C.brand);
    cell.font = { bold: true, color: { argb: C.white }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: column === 1 ? "left" : "center" };
    box(cell, C.brand);
  }
}

function scoreColor(score: number): string {
  if (score >= 75) return C.green;
  if (score >= 55) return C.amber;
  return C.red;
}

function dataBarRule(): any {
  return {
    type: "dataBar",
    cfvo: [
      { type: "num", value: 0 },
      { type: "num", value: 100 }
    ],
    color: { argb: C.brandBright },
    gradient: true,
    border: false,
    priority: 1
  } as any;
}

function countBarRule(maxValue: number): any {
  return {
    type: "dataBar",
    cfvo: [
      { type: "num", value: 0 },
      { type: "num", value: Math.max(1, maxValue) }
    ],
    color: { argb: C.brandBright },
    gradient: true,
    border: false,
    priority: 1
  } as any;
}

function sectionTitle(sheet: ExcelJS.Worksheet, rowIndex: number, fromCol: number, toCol: number, text: string): void {
  sheet.mergeCells(rowIndex, fromCol, rowIndex, toCol);
  const cell = sheet.getCell(rowIndex, fromCol);
  cell.value = text;
  cell.font = { bold: true, size: 12, color: { argb: C.ink } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(rowIndex).height = 20;
}

function metricCard(sheet: ExcelJS.Worksheet, startRow: number, startCol: number, value: string | number, label: string): void {
  sheet.mergeCells(startRow, startCol, startRow, startCol + 1);
  sheet.mergeCells(startRow + 1, startCol, startRow + 1, startCol + 1);
  const valueCell = sheet.getCell(startRow, startCol);
  valueCell.value = value;
  valueCell.font = { bold: true, size: 20, color: { argb: C.brand } };
  valueCell.alignment = { vertical: "middle", horizontal: "center" };
  const labelCell = sheet.getCell(startRow + 1, startCol);
  labelCell.value = label;
  labelCell.font = { size: 10, color: { argb: C.gray } };
  labelCell.alignment = { vertical: "top", horizontal: "center" };
  sheet.getRow(startRow).height = 30;
  sheet.getRow(startRow + 1).height = 16;
  for (let row = startRow; row <= startRow + 1; row += 1) {
    for (let col = startCol; col <= startCol + 1; col += 1) {
      const cell = sheet.getCell(row, col);
      fill(cell, C.card);
      box(cell, C.cardBorder);
    }
  }
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

// ─── Summary sheet ──────────────────────────────────────────────────────────
function buildSummarySheet(workbook: ExcelJS.Workbook, suggestions: KeywordSuggestion[]): void {
  const summary = summarizeSuggestions(suggestions);
  const sheet = workbook.addWorksheet("Summary", {
    views: [{ showGridLines: false }],
    properties: { defaultColWidth: 13 }
  });
  // Column widths: A margin, B..K content
  sheet.getColumn(1).width = 2.5;
  for (let col = 2; col <= 11; col += 1) sheet.getColumn(col).width = 13.5;

  // Title banner (B1:K2)
  sheet.mergeCells("B1:K2");
  const banner = sheet.getCell("B1");
  banner.value = "🛰  Keyword Radar — Keyword Report";
  banner.font = { bold: true, size: 18, color: { argb: C.white } };
  banner.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  for (let col = 2; col <= 11; col += 1) {
    fill(sheet.getCell(1, col), C.brand);
    fill(sheet.getCell(2, col), C.brand);
  }
  sheet.getRow(1).height = 22;
  sheet.getRow(2).height = 16;

  // Subtitle (B3:K3)
  sheet.mergeCells("B3:K3");
  const subtitle = sheet.getCell("B3");
  const created = new Date().toISOString().slice(0, 10);
  subtitle.value = `${created}  ·  ${summary.keywordCount} keywords  ·  ${summary.marketplaceCount} marketplace(s)  ·  ${summary.sources.join(", ")}`;
  subtitle.font = { size: 10, color: { argb: C.gray } };
  subtitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(3).height = 16;

  // Metric cards (row 5-6): 5 cards, 2 cols each, B..K
  const scores = suggestions.map((suggestion) => getDisplayScore(suggestion)).filter((value) => value > 0);
  const cards: Array<[string | number, string]> = [
    [summary.keywordCount, "Keywords"],
    [summary.totalHits, "Total hits"],
    [summary.queryCount, "Queries"],
    [average(scores), "Avg score"],
    [summary.topScore ?? 0, "Top score"]
  ];
  cards.forEach((card, index) => {
    metricCard(sheet, 5, 2 + index * 2, card[0], card[1]);
  });

  let row = 9;

  // Top opportunities table with data-bar "chart"
  sectionTitle(sheet, row, 2, 11, "Top opportunities");
  row += 1;
  const topHeaderRow = sheet.getRow(row);
  ["#", "Keyword", "Marketplace", "Hits", "Opportunity"].forEach((label, index) => {
    topHeaderRow.getCell(2 + index).value = label;
  });
  sheet.mergeCells(row, 3, row, 8); // Keyword spans wide
  sheet.mergeCells(row, 9, row, 9); // Marketplace
  styleHeaderRow(topHeaderRow, 11);
  // re-place merged header labels
  sheet.getCell(row, 2).value = "#";
  sheet.getCell(row, 3).value = "Keyword";
  sheet.getCell(row, 9).value = "Marketplace";
  sheet.getCell(row, 10).value = "Hits";
  sheet.getCell(row, 11).value = "Opportunity";
  const topStart = row + 1;
  const ranked = [...suggestions]
    .sort((left, right) => getDisplayScore(right) - getDisplayScore(left))
    .slice(0, 15);
  ranked.forEach((suggestion, index) => {
    row += 1;
    sheet.mergeCells(row, 3, row, 8);
    sheet.getCell(row, 2).value = index + 1;
    sheet.getCell(row, 3).value = suggestion.keyword;
    sheet.getCell(row, 9).value = suggestion.marketplace;
    sheet.getCell(row, 10).value = suggestion.occurrenceCount ?? 1;
    const scoreCell = sheet.getCell(row, 11);
    scoreCell.value = getDisplayScore(suggestion);
    scoreCell.font = { bold: true, color: { argb: scoreColor(getDisplayScore(suggestion)) } };
    for (let col = 2; col <= 11; col += 1) {
      const cell = sheet.getCell(row, col);
      if (index % 2 === 1) fill(cell, C.band);
      box(cell);
      if (col === 2 || col === 9 || col === 10 || col === 11) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    }
  });
  if (ranked.length) {
    sheet.addConditionalFormatting({ ref: `K${topStart}:K${row}`, rules: [dataBarRule()] });
  }

  row += 2;

  // Score distribution histogram (data bars)
  sectionTitle(sheet, row, 2, 6, "Score distribution");
  // Marketplace breakdown title (right side)
  sectionTitle(sheet, row, 8, 11, "By marketplace");
  row += 1;
  const bands: Array<[string, (score: number) => boolean]> = [
    ["90–100", (s) => s >= 90],
    ["75–89", (s) => s >= 75 && s < 90],
    ["60–74", (s) => s >= 60 && s < 75],
    ["40–59", (s) => s >= 40 && s < 60],
    ["0–39", (s) => s < 40]
  ];
  const bandHeader = sheet.getRow(row);
  bandHeader.getCell(2).value = "Band";
  sheet.mergeCells(row, 2, row, 3);
  bandHeader.getCell(4).value = "Count";
  sheet.mergeCells(row, 4, row, 6);
  // marketplace header
  bandHeader.getCell(8).value = "Marketplace";
  sheet.mergeCells(row, 8, row, 9);
  bandHeader.getCell(10).value = "Keywords";
  sheet.mergeCells(row, 10, row, 11);
  for (const col of [2, 4, 8, 10]) {
    const cell = bandHeader.getCell(col);
    fill(cell, C.brand);
    cell.font = { bold: true, color: { argb: C.white }, size: 11 };
    cell.alignment = { horizontal: col === 2 || col === 8 ? "left" : "center", vertical: "middle" };
  }
  [3, 5, 6, 9, 11].forEach((col) => fill(bandHeader.getCell(col), C.brand));
  bandHeader.height = 20;

  const marketplaceCounts = new Map<string, number>();
  for (const suggestion of suggestions) {
    marketplaceCounts.set(suggestion.marketplace, (marketplaceCounts.get(suggestion.marketplace) ?? 0) + 1);
  }
  const marketplaceRows = Array.from(marketplaceCounts.entries()).sort((left, right) => right[1] - left[1]);
  const distStart = row + 1;
  const maxBandCount = Math.max(1, ...bands.map(([, test]) => scores.filter(test).length));
  const maxMarketplaceCount = Math.max(1, ...marketplaceRows.map(([, count]) => count));
  const distRowCount = Math.max(bands.length, marketplaceRows.length);
  for (let index = 0; index < distRowCount; index += 1) {
    row += 1;
    const band = bands[index];
    const marketplace = marketplaceRows[index];
    sheet.mergeCells(row, 2, row, 3);
    sheet.mergeCells(row, 4, row, 6);
    sheet.mergeCells(row, 8, row, 9);
    sheet.mergeCells(row, 10, row, 11);
    if (band) {
      sheet.getCell(row, 2).value = band[0];
      sheet.getCell(row, 4).value = scores.filter(band[1]).length;
    }
    if (marketplace) {
      sheet.getCell(row, 8).value = marketplace[0];
      sheet.getCell(row, 10).value = marketplace[1];
    }
    for (const col of [2, 3, 4, 5, 6, 8, 9, 10, 11]) {
      const cell = sheet.getCell(row, col);
      if (index % 2 === 1) fill(cell, C.band);
      box(cell);
    }
    sheet.getCell(row, 4).alignment = { horizontal: "center", vertical: "middle" };
    sheet.getCell(row, 10).alignment = { horizontal: "center", vertical: "middle" };
  }
  sheet.addConditionalFormatting({ ref: `D${distStart}:D${distStart + bands.length - 1}`, rules: [countBarRule(maxBandCount)] });
  if (marketplaceRows.length) {
    sheet.addConditionalFormatting({
      ref: `J${distStart}:J${distStart + marketplaceRows.length - 1}`,
      rules: [countBarRule(maxMarketplaceCount)]
    });
  }

  row += 2;

  // Top search words (data bars)
  sectionTitle(sheet, row, 2, 11, "Top search words");
  row += 1;
  const wordHeader = sheet.getRow(row);
  wordHeader.getCell(2).value = "Word";
  sheet.mergeCells(row, 2, row, 7);
  wordHeader.getCell(8).value = "Weight";
  sheet.mergeCells(row, 8, row, 11);
  for (const col of [2, 8]) {
    const cell = wordHeader.getCell(col);
    fill(cell, C.brand);
    cell.font = { bold: true, color: { argb: C.white }, size: 11 };
    cell.alignment = { horizontal: col === 2 ? "left" : "center", vertical: "middle" };
  }
  [3, 4, 5, 6, 7, 9, 10, 11].forEach((col) => fill(wordHeader.getCell(col), C.brand));
  wordHeader.height = 20;
  const words = calculateWordFrequencyForExport(suggestions).slice(0, 12);
  const wordStart = row + 1;
  const maxWord = Math.max(1, ...words.map((word) => word.count));
  words.forEach((word, index) => {
    row += 1;
    sheet.mergeCells(row, 2, row, 7);
    sheet.mergeCells(row, 8, row, 11);
    sheet.getCell(row, 2).value = word.word;
    sheet.getCell(row, 8).value = word.count;
    for (const col of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      const cell = sheet.getCell(row, col);
      if (index % 2 === 1) fill(cell, C.band);
      box(cell);
    }
    sheet.getCell(row, 8).alignment = { horizontal: "center", vertical: "middle" };
  });
  if (words.length) {
    sheet.addConditionalFormatting({ ref: `H${wordStart}:H${row}`, rules: [countBarRule(maxWord)] });
  }

  sheet.views = [{ showGridLines: false, state: "frozen", ySplit: 3 }];
}

// ─── Keywords sheet (styled data table + score heatmap) ─────────────────────
function buildKeywordsSheet(workbook: ExcelJS.Workbook, suggestions: KeywordSuggestion[]): void {
  const sheet = workbook.addWorksheet("Keywords", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = EXPORT_COLUMNS.map((column) => ({
    header: FRIENDLY_HEADERS[column],
    key: column,
    width: column === "keyword" || column === "normalized_keyword" ? 30 : column === "collected_at" ? 22 : 13
  }));

  suggestions.forEach((suggestion, index) => {
    const row = sheet.addRow(toRow(suggestion));
    row.height = 17;
    if (index % 2 === 1) {
      for (let col = 1; col <= EXPORT_COLUMNS.length; col += 1) fill(row.getCell(col), C.band);
    }
    EXPORT_COLUMNS.forEach((column, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      box(cell);
      if (SCORE_COLUMNS.has(column) || column === "position" || column === "best_position" || column === "occurrence_count" || column === "expansion_count") {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  });

  styleHeaderRow(sheet.getRow(1), EXPORT_COLUMNS.length);
  sheet.autoFilter = {
    from: "A1",
    to: `${colLetter(EXPORT_COLUMNS.length)}1`
  };

  const lastRow = suggestions.length + 1;
  if (suggestions.length) {
    const opportunityCol = colLetter(EXPORT_COLUMNS.indexOf("opportunity_score") + 1);
    sheet.addConditionalFormatting({ ref: `${opportunityCol}2:${opportunityCol}${lastRow}`, rules: [dataBarRule()] });
    // Score heatmap (red→amber→green) across the sub-score columns
    const firstScore = colLetter(EXPORT_COLUMNS.indexOf("frequency_score") + 1);
    const lastScore = colLetter(EXPORT_COLUMNS.indexOf("confidence_score") + 1);
    sheet.addConditionalFormatting({
      ref: `${firstScore}2:${lastScore}${lastRow}`,
      rules: [
        {
          type: "colorScale",
          cfvo: [
            { type: "num", value: 0 },
            { type: "num", value: 50 },
            { type: "num", value: 100 }
          ],
          color: [{ argb: C.red }, { argb: C.amber }, { argb: C.green }],
          priority: 1
        } as any
      ]
    });
  }
}

// ─── Analysis sheet ─────────────────────────────────────────────────────────
function buildAnalysisSheet(workbook: ExcelJS.Workbook, suggestions: KeywordSuggestion[]): void {
  const sheet = workbook.addWorksheet("Analysis", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
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
    const row = sheet.addRow({
      word: word?.word,
      count: word?.count,
      normalizedKeyword: coverageItem?.normalizedKeyword,
      marketplaces: coverageItem?.marketplaces.join(", "),
      coverageCount: coverageItem?.count
    });
    if (index % 2 === 1) {
      for (const col of [1, 2, 4, 5, 6]) fill(row.getCell(col), C.band);
    }
  }
  for (const col of [1, 2, 4, 5, 6]) {
    const cell = sheet.getRow(1).getCell(col);
    fill(cell, C.brand);
    cell.font = { bold: true, color: { argb: C.white } };
  }
  sheet.getRow(1).height = 22;
  if (words.length) {
    sheet.addConditionalFormatting({ ref: `B2:B${words.length + 1}`, rules: [countBarRule(words[0]?.count ?? 1)] });
  }
}

// ─── Listing gap sheet ──────────────────────────────────────────────────────
function buildGapSheet(workbook: ExcelJS.Workbook, listingGapAnalysis: ListingGapAnalysis): void {
  const sheet = workbook.addWorksheet("Listing Gap", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "keyword", key: "keyword", width: 32 },
    { header: "score", key: "score", width: 12 },
    { header: "opportunity_score", key: "opportunityScore", width: 18 },
    { header: "hits", key: "occurrenceCount", width: 12 },
    { header: "in_title", key: "presentInTitle", width: 12 },
    { header: "in_body", key: "presentInBody", width: 12 },
    { header: "reason", key: "reason", width: 64 }
  ];
  listingGapAnalysis.missingHighValueKeywords.forEach((item, index) => {
    const row = sheet.addRow(item);
    if (index % 2 === 1) {
      for (let col = 1; col <= 7; col += 1) fill(row.getCell(col), C.band);
    }
    for (let col = 1; col <= 7; col += 1) box(row.getCell(col));
  });
  styleHeaderRow(sheet.getRow(1), 7);
  const lastRow = listingGapAnalysis.missingHighValueKeywords.length + 1;
  if (listingGapAnalysis.missingHighValueKeywords.length) {
    sheet.addConditionalFormatting({ ref: `C2:C${lastRow}`, rules: [dataBarRule()] });
  }
}

export function toXlsxWorkbook(suggestions: KeywordSuggestion[], listingGapAnalysis?: ListingGapAnalysis): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bluedev Marketplace Keyword Radar";
  workbook.created = new Date();
  buildSummarySheet(workbook, suggestions);
  buildKeywordsSheet(workbook, suggestions);
  buildAnalysisSheet(workbook, suggestions);
  if (listingGapAnalysis) {
    buildGapSheet(workbook, listingGapAnalysis);
  }
  return workbook;
}

export async function downloadXlsx(suggestions: KeywordSuggestion[], filename = "keyword-radar-export.xlsx", listingGapAnalysis?: ListingGapAnalysis): Promise<void> {
  const workbook = toXlsxWorkbook(suggestions, listingGapAnalysis);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function colLetter(columnNumber: number): string {
  let result = "";
  let n = columnNumber;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
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
