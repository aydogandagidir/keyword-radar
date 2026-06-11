// Lazy-loaded XLSX export chunk (web-accessible resource).
//
// The whole world-class workbook builder lives in `@bluedev/export`; this entry
// only re-exposes it so the content panel can dynamically import the heavy
// ExcelJS bundle on demand (and reach it via window.BluedevKeywordRadarXlsx).
import { downloadXlsx } from "@bluedev/export";
import type { KeywordSuggestion, ListingGapAnalysis } from "@bluedev/shared-types";

type XlsxExporter = {
  downloadXlsx: (
    suggestions: KeywordSuggestion[],
    filename?: string,
    listingGapAnalysis?: ListingGapAnalysis
  ) => Promise<void>;
};

declare global {
  var BluedevKeywordRadarXlsx: XlsxExporter | undefined;
}

globalThis.BluedevKeywordRadarXlsx = { downloadXlsx };

export { downloadXlsx };
