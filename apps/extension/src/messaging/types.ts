import type { KeywordSuggestion } from "@bluedev/shared-types";

export type ExtensionMessage =
  | { type: "KEYWORD_RADAR_PING" }
  | { type: "KEYWORD_RADAR_TOGGLE_PANEL" }
  | { type: "KEYWORD_RADAR_RESULTS"; suggestions: KeywordSuggestion[] };
