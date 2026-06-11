import React, { useEffect, useMemo, useRef, useState } from "react";
import { calculateWordFrequency, compareMarketplaceCoverage, createThrottledQueue, dedupeKeywords, generateKeywordExpansions, normalizeKeyword, sleep } from "@bluedev/core";
import { analyzeListingGap, scoreSuggestion } from "@bluedev/scoring";
import type { KeywordExpansionMode, KeywordSuggestion, ListingGapAnalysis, MarketplaceAdapter, MarketplaceSearchControl } from "@bluedev/shared-types";
import { saveKeywordRunLocally } from "../storage/saved-runs";
import type { ExtensionMessage } from "../messaging/types";
import {
  createTranslator,
  type LocalePref,
  type MessageKey,
  type Translate,
  readLocalePref,
  resolveLocale,
  writeLocalePref
} from "../i18n";

const modes: Array<{ id: KeywordExpansionMode; labelKey: MessageKey }> = [
  { id: "original", labelKey: "mode.original" },
  { id: "suffix-alpha", labelKey: "mode.suffixAlpha" },
  { id: "prefix-alpha", labelKey: "mode.prefixAlpha" },
  { id: "suffix-numeric", labelKey: "mode.suffixNumeric" }
];
const defaultModes: KeywordExpansionMode[] = ["original", "suffix-alpha"];
type CollectionSpeed = "fast" | "balanced" | "reliable";
type CollectionSpeedProfile = {
  queueIntervalMs: number;
  trendyolQueueIntervalMs: number;
  suggestionDelaysMs: number[];
  trendyolBridgeTimeoutMs: number;
};
const speedModes: Array<{ id: CollectionSpeed; labelKey: MessageKey }> = [
  { id: "fast", labelKey: "speed.fast" },
  { id: "balanced", labelKey: "speed.balanced" },
  { id: "reliable", labelKey: "speed.reliable" }
];
const speedProfiles: Record<CollectionSpeed, CollectionSpeedProfile> = {
  fast: {
    queueIntervalMs: 300,
    trendyolQueueIntervalMs: 120,
    suggestionDelaysMs: [180, 280, 420],
    trendyolBridgeTimeoutMs: 1200
  },
  balanced: {
    queueIntervalMs: 750,
    trendyolQueueIntervalMs: 220,
    suggestionDelaysMs: [300, 500, 800, 1200],
    trendyolBridgeTimeoutMs: 2600
  },
  reliable: {
    queueIntervalMs: 1000,
    trendyolQueueIntervalMs: 320,
    suggestionDelaysMs: [500, 800, 1200, 1600, 2200],
    trendyolBridgeTimeoutMs: 3600
  }
};
type ActionNotice = { kind: "success" | "error"; message: string };
type AnalysisTab = "words" | "coverage" | "actions" | "gap";
type SalesAction = { title: string; detail: string };
type PanelSize = { width: number; height: number };
type PanelPosition = { x: number; y: number };
type IconName = "collapse" | "expand" | "close" | "copy" | "csv" | "xlsx";
type SaveStatus = "idle" | "saving";
type TrendyolBridgeResponse = {
  source?: string;
  type?: string;
  requestId?: string;
  ok?: boolean;
  payload?: unknown;
  error?: string;
};
type TrendyolSuggestionApiItem = {
  name?: unknown;
  text?: unknown;
  keyword?: unknown;
  position?: unknown;
  type?: unknown;
  label?: unknown;
  labelEn?: unknown;
};
type TrendyolSuggestionApiPayload = {
  suggestions?: unknown;
  boutiqueSuggestions?: unknown;
  singleSuggestions?: {
    suggestions?: unknown;
  };
};
const collapseStorageKey = "bluedev-keyword-radar-collapsed";
const speedStorageKey = "bluedev-keyword-radar-speed";
const panelSizeStorageKey = "bluedev-keyword-radar-panel-size";
const panelPositionStorageKey = "bluedev-keyword-radar-panel-position";
const analysisHeightStorageKey = "bluedev-keyword-radar-analysis-height";
const listingGapStorageKey = "bluedev-keyword-radar-listing-gap";
const defaultPanelSize: PanelSize = { width: 480, height: 760 };
const collapsedPanelWidth = 220;
const defaultAnalysisHeight = 94;
const trendyolBridgeScriptId = "bluedev-keyword-radar-trendyol-bridge";
const trendyolBridgeRequestSource = "bluedev-keyword-radar";
const trendyolBridgeResponseSource = "bluedev-keyword-radar-page";
const trendyolBridgeRequestType = "TRENDYOL_AUTOCOMPLETE_REQUEST";
const trendyolBridgeResponseType = "TRENDYOL_AUTOCOMPLETE_RESPONSE";

export function KeywordRadarPanel({ adapter }: { adapter: MarketplaceAdapter }) {
  const [seed, setSeed] = useState("");
  const [selectedModes, setSelectedModes] = useState<KeywordExpansionMode[]>(defaultModes);
  const [selectedSpeed, setSelectedSpeed] = useState<CollectionSpeed>("balanced");
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState<"idle" | "collecting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<AnalysisTab>("words");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [listingTitle, setListingTitle] = useState("");
  const [listingDescription, setListingDescription] = useState("");
  const [listingGapAnalysis, setListingGapAnalysis] = useState<ListingGapAnalysis | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const ignoreCollapsedClickRef = useRef(false);
  const [panelSize, setPanelSize] = useState<PanelSize | null>(null);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const [analysisHeight, setAnalysisHeight] = useState<number | null>(null);
  const [localePref, setLocalePref] = useState<LocalePref>("auto");

  const t = useMemo(() => createTranslator(resolveLocale(localePref)), [localePref]);
  const wordFrequency = useMemo(() => calculateWordFrequency(suggestions).slice(0, 8), [suggestions]);
  const coverage = useMemo(() => compareMarketplaceCoverage(suggestions).slice(0, 8), [suggestions]);
  const salesActions = useMemo(() => buildSalesActions(suggestions, seed, t), [suggestions, seed, t]);
  const totalOccurrences = useMemo(() => suggestions.reduce((sum, suggestion) => sum + (suggestion.occurrenceCount ?? 1), 0), [suggestions]);
  const statusLabel =
    status === "collecting"
      ? t("status.collecting")
      : status === "done"
        ? t("status.collected")
        : status === "error"
          ? t("status.error")
          : t("status.ready");

  useEffect(() => {
    void readLocalePref().then(setLocalePref);
  }, []);

  function updateLocalePref(next: LocalePref) {
    setLocalePref(next);
    void writeLocalePref(next);
  }

  useEffect(() => {
    void readCollapsedPreference().then(setIsCollapsed);
  }, []);

  useEffect(() => {
    void readSpeedPreference().then(setSelectedSpeed);
  }, []);

  useEffect(() => {
    void readPanelSizePreference().then(setPanelSize);
  }, []);

  useEffect(() => {
    void readPanelPositionPreference().then(setPanelPosition);
  }, []);

  useEffect(() => {
    void readAnalysisHeightPreference().then(setAnalysisHeight);
  }, []);

  useEffect(() => {
    void readListingGapPreference(adapter.id).then((value) => {
      setListingTitle(value.title);
      setListingDescription(value.description);
    });
  }, [adapter.id]);

  useEffect(() => {
    const handleMessage = (message: ExtensionMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response?: { ok: boolean }) => void) => {
      if (message?.type !== "KEYWORD_RADAR_TOGGLE_PANEL") {
        return false;
      }

      if (isClosed || isCollapsed) {
        if (isCollapsed) {
          positionExpandedPanelFromCollapsed();
        }
        setIsClosed(false);
        setIsCollapsed(false);
        void writeCollapsedPreference(false);
      } else {
        abortRef.current?.abort();
        setIsClosed(true);
      }

      sendResponse({ ok: true });
      return false;
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
    // Listener re-binds on open/collapsed changes; repositioning reads the live
    // panel rect (panelRef), so the captured layout state here is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClosed, isCollapsed]);

  useEffect(() => {
    if (isCollapsed || !panelRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    let timeoutId: number | undefined;
    const observer = new ResizeObserver(() => {
      const element = panelRef.current;
      if (!element) {
        return;
      }

      const nextSize = clampPanelSize({
        width: Math.round(element.offsetWidth),
        height: Math.round(element.offsetHeight)
      });

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        void writePanelSizePreference(nextSize);
      }, 250);
    });

    observer.observe(panelRef.current);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isCollapsed]);

  async function collect() {
    const trimmedSeed = seed.trim();
    if (!trimmedSeed || status === "collecting") {
      return;
    }

    const input = await waitForSearchInput(adapter);
    if (!input && adapter.id !== "trendyol") {
      setError(t("error.noSearchInput"));
      setStatus("error");
      return;
    }

    const expansions = generateKeywordExpansions(trimmedSeed, { modes: selectedModes });
    const speedProfile = speedProfiles[selectedSpeed];
    const abortController = new AbortController();
    abortRef.current = abortController;
    setStatus("collecting");
    setError(null);
    setProgress({ current: 0, total: expansions.length });

    const queue = createThrottledQueue({ intervalMs: getQueueIntervalMs(adapter, speedProfile), signal: abortController.signal });
    const collected: KeywordSuggestion[] = [];

    try {
      for (const expansion of expansions) {
        await queue.add(async () => {
          if (abortController.signal.aborted) {
            return;
          }
          const extracted = await collectSuggestionsForExpansion(adapter, expansion, input, speedProfile);
          const relevantExtracted = extracted.filter((suggestion) => isRelevantSuggestion(suggestion, trimmedSeed, expansion));
          const acceptedSuggestions = relevantExtracted.length > 0 || shouldRequireSeedToken(adapter) ? relevantExtracted : extracted;
          collected.push(
            ...acceptedSuggestions.map((suggestion) => ({
              ...suggestion,
              expansion
            }))
          );
          const deduped = sortSuggestionsForDisplay(
            dedupeKeywords(collected).map((suggestion) => ({
              ...suggestion,
              score: scoreSuggestion(suggestion, collected)
            }))
          );
          setSuggestions(deduped);
          setProgress((value) => ({ ...value, current: value.current + 1 }));
        });
      }
      setStatus("done");
    } catch (collectionError) {
      if ((collectionError as Error).name !== "AbortError") {
        setError(collectionError instanceof Error ? collectionError.message : t("error.collectionFailed"));
        setStatus("error");
      }
    } finally {
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setStatus("done");
  }

  function toggleMode(mode: KeywordExpansionMode) {
    setSelectedModes((current) => (current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]));
  }

  function updateSpeed(speed: CollectionSpeed) {
    setSelectedSpeed(speed);
    void writeSpeedPreference(speed);
  }

  async function copyResults() {
    try {
      await writeClipboardText(toPanelCsv(suggestions));
      showActionNotice(t("notice.copied"), "success");
    } catch (copyError) {
      showActionNotice(copyError instanceof Error ? copyError.message : t("notice.copyFailed"), "error");
    }
  }

  function exportCsv() {
    try {
      downloadPanelCsv(suggestions);
      showActionNotice(t("notice.csvDownloaded"), "success");
    } catch (csvError) {
      showActionNotice(csvError instanceof Error ? csvError.message : t("notice.csvFailed"), "error");
    }
  }

  async function exportXlsx() {
    try {
      const exportModuleUrl = chrome.runtime.getURL("assets/xlsx.js");
      const exportModule = await import(/* @vite-ignore */ exportModuleUrl) as { downloadXlsx?: (items: KeywordSuggestion[], filename?: string, analysis?: ListingGapAnalysis) => Promise<void> };
      const globalExporter = globalThis as typeof globalThis & {
        BluedevKeywordRadarXlsx?: { downloadXlsx?: (items: KeywordSuggestion[], filename?: string, analysis?: ListingGapAnalysis) => Promise<void> };
      };
      const downloadXlsx = exportModule.downloadXlsx ?? globalExporter.BluedevKeywordRadarXlsx?.downloadXlsx;
      if (typeof downloadXlsx !== "function") {
        throw new Error("XLSX module was not loaded correctly.");
      }
      await downloadXlsx(suggestions, undefined, listingGapAnalysis ?? undefined);
      showActionNotice(t("notice.xlsxDownloaded"), "success");
    } catch (xlsxError) {
      showActionNotice(xlsxError instanceof Error ? xlsxError.message : t("notice.xlsxFailed"), "error");
    }
  }

  async function saveRun() {
    if (suggestions.length === 0 || saveStatus === "saving") {
      return;
    }

    setSaveStatus("saving");

    try {
      const savedRun = await saveKeywordRunLocally({
        seedKeyword: seed.trim() || "keyword run",
        marketplace: adapter.id,
        marketplaceName: adapter.name,
        expansionModes: selectedModes,
        suggestions,
        listingGapAnalysis
      });
      showActionNotice(t("notice.savedLocally", { count: savedRun.suggestions.length }), "success");
    } catch (saveError) {
      showActionNotice(saveError instanceof Error ? saveError.message : t("notice.saveFailed"), "error");
    } finally {
      setSaveStatus("idle");
    }
  }

  function analyzeCurrentListingGap() {
    if (!listingTitle.trim()) {
      showActionNotice(t("notice.titleRequired"), "error");
      return;
    }
    if (suggestions.length === 0) {
      showActionNotice(t("notice.collectFirst"), "error");
      return;
    }

    const analysis = analyzeListingGap(
      {
        marketplace: adapter.id,
        title: listingTitle,
        description: listingDescription
      },
      suggestions
    );
    setListingGapAnalysis(analysis);
    void writeListingGapPreference(adapter.id, { title: listingTitle, description: listingDescription });
    showActionNotice(t("notice.gapAnalyzed"), "success");
  }

  function showActionNotice(message: string, kind: ActionNotice["kind"]) {
    setActionNotice({ message, kind });
    window.setTimeout(() => {
      setActionNotice((current) => (current?.message === message ? null : current));
    }, 2600);
  }

  function updateCollapsedPreference(nextValue: boolean) {
    if (nextValue) {
      positionCollapsedPanelFromExpanded();
    }

    setIsCollapsed(nextValue);
    void writeCollapsedPreference(nextValue);
  }

  function expandPanelFromCollapsed() {
    positionExpandedPanelFromCollapsed();
    updateCollapsedPreference(false);
  }

  function positionCollapsedPanelFromExpanded() {
    const element = panelRef.current;
    const rect = element?.getBoundingClientRect();
    const rightEdge = rect ? rect.right : (panelPosition?.x ?? window.innerWidth - (panelSize?.width ?? defaultPanelSize.width) - 20) + (panelSize?.width ?? defaultPanelSize.width);
    const topEdge = rect ? rect.top : panelPosition?.y ?? 18;
    const nextPosition = clampPanelPosition({ x: rightEdge - collapsedPanelWidth, y: topEdge }, { width: collapsedPanelWidth, height: 48 });
    setPanelPosition(nextPosition);
    void writePanelPositionPreference(nextPosition);
  }

  function positionExpandedPanelFromCollapsed() {
    const element = panelRef.current;
    const targetSize = clampPanelSize(panelSize ?? defaultPanelSize);
    const rect = element?.getBoundingClientRect();
    const rightEdge = rect ? rect.right : (panelPosition?.x ?? window.innerWidth - collapsedPanelWidth - 20) + collapsedPanelWidth;
    const topEdge = rect ? rect.top : panelPosition?.y ?? 18;
    const nextPosition = clampPanelPosition({ x: rightEdge - targetSize.width, y: topEdge }, targetSize);
    setPanelPosition(nextPosition);
    void writePanelPositionPreference(nextPosition);
  }

  function closePanel() {
    abortRef.current?.abort();
    setIsClosed(true);
  }

  async function copyKeyword(keyword: string) {
    try {
      await writeClipboardText(keyword);
      showActionNotice(t("notice.keywordCopied"), "success");
    } catch (copyError) {
      showActionNotice(copyError instanceof Error ? copyError.message : t("notice.copyFailed"), "error");
    }
  }

  function startPanelResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const element = panelRef.current;
    if (!element) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const startSize = {
      width: element.offsetWidth,
      height: element.offsetHeight
    };
    const startRect = element.getBoundingClientRect();
    let latestSize = clampPanelSize(startSize);
    let latestPosition = panelPosition;

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      latestSize = clampPanelSize({
        width: startSize.width + startX - pointerEvent.clientX,
        height: startSize.height + pointerEvent.clientY - startY
      });
      setPanelSize(latestSize);

      if (panelPosition) {
        latestPosition = clampPanelPosition({
          x: startRect.right - latestSize.width,
          y: startRect.top
        }, latestSize);
        setPanelPosition(latestPosition);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      void writePanelSizePreference(latestSize);
      if (latestPosition) {
        void writePanelPositionPreference(latestPosition);
      }
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  function startPanelDrag(event: React.PointerEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, input, label, a")) {
      return;
    }

    event.preventDefault();
    const element = panelRef.current;
    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const currentSize = clampPanelSize({
      width: element.offsetWidth,
      height: element.offsetHeight
    });
    const startX = event.clientX;
    const startY = event.clientY;
    const startPosition = { x: rect.left, y: rect.top };
    let latestPosition = clampPanelPosition(startPosition, currentSize);

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      latestPosition = clampPanelPosition({
        x: startPosition.x + pointerEvent.clientX - startX,
        y: startPosition.y + pointerEvent.clientY - startY
      }, currentSize);
      setPanelPosition(latestPosition);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      void writePanelPositionPreference(latestPosition);
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  function startCollapsedPanelDrag(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest("button")) {
      return;
    }

    const element = panelRef.current;
    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const currentSize = {
      width: Math.round(element.offsetWidth),
      height: Math.round(element.offsetHeight)
    };
    const startX = event.clientX;
    const startY = event.clientY;
    const startPosition = { x: rect.left, y: rect.top };
    let latestPosition = clampPanelPosition(startPosition, currentSize);
    let hasDragged = false;

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      const deltaX = pointerEvent.clientX - startX;
      const deltaY = pointerEvent.clientY - startY;
      if (!hasDragged && Math.hypot(deltaX, deltaY) < 4) {
        return;
      }

      hasDragged = true;
      pointerEvent.preventDefault();
      latestPosition = clampPanelPosition({
        x: startPosition.x + deltaX,
        y: startPosition.y + deltaY
      }, currentSize);
      setPanelPosition(latestPosition);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      if (hasDragged) {
        ignoreCollapsedClickRef.current = true;
        void writePanelPositionPreference(latestPosition);
      }
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  function handleCollapsedClick(event: React.MouseEvent<HTMLElement>) {
    if (ignoreCollapsedClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      ignoreCollapsedClickRef.current = false;
      return;
    }
  }

  function startAnalysisResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const startHeight = analysisHeight ?? defaultAnalysisHeight;
    let latestHeight = clampAnalysisHeight(startHeight);

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      latestHeight = clampAnalysisHeight(startHeight + startY - pointerEvent.clientY);
      setAnalysisHeight(latestHeight);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      void writeAnalysisHeightPreference(latestHeight);
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  if (isClosed) {
    return null;
  }

  if (isCollapsed) {
    return (
      <section ref={panelRef} className="radar-panel radar-panel-collapsed" style={getPanelStyle(null, panelPosition)} aria-label="Bluedev Marketplace Keyword Radar">
        <div className="collapsed-bar" onPointerDown={startCollapsedPanelDrag} onClick={handleCollapsedClick} onDoubleClick={expandPanelFromCollapsed} aria-label={t("a11y.dragCollapsed")}>
          <div>
            <span>Keyword Radar</span>
            <strong>{adapter.name}</strong>
          </div>
          <button type="button" className="collapsed-expand-button" onClick={expandPanelFromCollapsed} aria-label={t("a11y.expand")} title={t("a11y.expandTitle")}>
            <Icon name="expand" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section ref={panelRef} className="radar-panel" style={getPanelStyle(panelSize, panelPosition)} aria-label="Bluedev Marketplace Keyword Radar">
      <header className="radar-header" onPointerDown={startPanelDrag}>
        <div>
          <p className="eyebrow">Keyword Radar</p>
          <h1>{adapter.name}</h1>
        </div>
        <div className="header-actions">
          <select
            className="locale-select"
            aria-label={t("locale.label")}
            value={localePref}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => updateLocalePref(event.target.value as LocalePref)}
            style={{ fontSize: 11, padding: "2px 6px", borderRadius: 6, border: "1px solid rgba(148, 163, 184, 0.4)", background: "transparent", color: "inherit", cursor: "pointer" }}
          >
            <option value="auto">{t("locale.auto")}</option>
            <option value="en">EN</option>
            <option value="tr">TR</option>
          </select>
          <span className={`status status-${status}`}>{statusLabel}</span>
          <button type="button" className="icon-button" onClick={() => updateCollapsedPreference(true)} aria-label={t("a11y.collapse")} title={t("a11y.collapseTitle")}>
            <Icon name="collapse" />
          </button>
          <button type="button" className="icon-button close-button" onClick={closePanel} aria-label={t("a11y.close")} title={t("a11y.closeTitle")}>
            <Icon name="close" />
          </button>
        </div>
      </header>

      <div className="control-grid">
        <label className="field seed-field">
          <span>{t("field.seed")}</span>
          <input value={seed} onChange={(event) => setSeed(event.target.value)} placeholder={t("field.seedPlaceholder")} aria-label={t("field.seed")} />
        </label>
      </div>

      <div className="mode-grid" aria-label={t("a11y.modes")}>
        {modes.map((mode) => (
          <label key={mode.id} className="check">
            <input type="checkbox" checked={selectedModes.includes(mode.id)} onChange={() => toggleMode(mode.id)} />
            <span>{t(mode.labelKey)}</span>
          </label>
        ))}
      </div>

      <div className="speed-grid" aria-label={t("a11y.speed")}>
        {speedModes.map((speed) => (
          <label key={speed.id} className="speed-option">
            <input type="radio" name="bluedev-keyword-radar-speed" checked={selectedSpeed === speed.id} onChange={() => updateSpeed(speed.id)} disabled={status === "collecting"} />
            <span>{t(speed.labelKey)}</span>
          </label>
        ))}
      </div>

      <div className="actions">
        <button type="button" onClick={collect} disabled={!seed.trim() || selectedModes.length === 0 || status === "collecting"}>
          {t("action.collect")}
        </button>
        <button type="button" className="secondary" onClick={stop} disabled={status !== "collecting"}>
          {t("action.stop")}
        </button>
      </div>

      {progress.total > 0 ? (
        <div className={`progress progress-${status}`} aria-label={t("a11y.progress")}>
          <div style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }} />
          <span>
            {t("progress.queries")} {progress.current}/{progress.total}
          </span>
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <div className="summary-bar">
        <div className="metrics" aria-label={t("a11y.summary")}>
          <span>
            <strong>{suggestions.length}</strong>
            <small>{t("metric.keywords")}</small>
          </span>
          <span>
            <strong>{totalOccurrences}</strong>
            <small>{t("metric.hits")}</small>
          </span>
          <span>
            <strong>{progress.total || 0}</strong>
            <small>{t("metric.queries")}</small>
          </span>
        </div>
        <div className="toolbar" aria-label={t("a11y.exportActions")}>
          <button type="button" className="secondary copy-export-button" onClick={copyResults} disabled={suggestions.length === 0} aria-label={t("a11y.copyResults")} title={t("a11y.copyResults")}>
            <Icon name="copy" />
            <span>{t("action.copy")}</span>
          </button>
          <button type="button" className="secondary" onClick={exportCsv} disabled={suggestions.length === 0} aria-label={t("a11y.exportCsv")} title={t("a11y.exportCsv")}>
            <Icon name="csv" />
            <span>{t("action.csv")}</span>
          </button>
          <button type="button" className="secondary" onClick={() => void exportXlsx()} disabled={suggestions.length === 0} aria-label={t("a11y.exportXlsx")} title={t("a11y.exportXlsx")}>
            <Icon name="xlsx" />
            <span>{t("action.xlsx")}</span>
          </button>
          <button type="button" className="secondary save-run-button" onClick={() => void saveRun()} disabled={suggestions.length === 0 || saveStatus === "saving"} aria-label={t("a11y.saveRun")} title={t("tooltip.save")}>
            <span>{saveStatus === "saving" ? t("action.saving") : t("action.save")}</span>
          </button>
        </div>
      </div>

      {actionNotice ? <p className={`action-notice action-notice-${actionNotice.kind}`}>{actionNotice.message}</p> : null}

      {suggestions.length === 0 ? (
        <p className="empty">
          {status === "done" ? t("empty.done") : t("empty.idle")}
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("table.keyword")}</th>
                <th>{t("table.hits")}</th>
                <th>{t("table.score")}</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => (
                <tr key={`${suggestion.marketplace}-${suggestion.normalizedKeyword}`}>
                  <td>
                    <div className="keyword-cell">
                      <div>
                        <strong>{suggestion.keyword}</strong>
                        <small>{suggestion.normalizedKeyword} | best #{suggestion.bestPosition ?? suggestion.position}</small>
                      </div>
                      <button type="button" className="row-action" onClick={() => void copyKeyword(suggestion.keyword)} aria-label={t("a11y.copyKeyword", { keyword: suggestion.keyword })} title={t("a11y.copyKeywordTitle")}>
                        <Icon name="copy" />
                      </button>
                    </div>
                  </td>
                  <td>{suggestion.occurrenceCount ?? 1}</td>
                  <td>
                    <span className={`score-badge score-${getScoreLevel(suggestion.score?.opportunityScore)}`} title={getScoreTitle(suggestion, t)}>
                      {suggestion.score?.opportunityScore ?? "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="analysis-panel">
        <button type="button" className="analysis-resize-handle" onPointerDown={startAnalysisResize} aria-label={t("a11y.resizeAnalysis")} />
        <div className="analysis-tabs" role="tablist" aria-label={t("a11y.analysis")}>
          <button type="button" className={activeAnalysisTab === "words" ? "active" : ""} onClick={() => setActiveAnalysisTab("words")} role="tab" aria-selected={activeAnalysisTab === "words"} title={t("tooltip.words")}>
            {t("tab.words")}
          </button>
          <button type="button" className={activeAnalysisTab === "coverage" ? "active" : ""} onClick={() => setActiveAnalysisTab("coverage")} role="tab" aria-selected={activeAnalysisTab === "coverage"} title={t("tooltip.coverage")}>
            {t("tab.coverage")}
          </button>
          <button type="button" className={activeAnalysisTab === "actions" ? "active" : ""} onClick={() => setActiveAnalysisTab("actions")} role="tab" aria-selected={activeAnalysisTab === "actions"} title={t("tooltip.actions")}>
            {t("tab.actions")}
          </button>
          <button type="button" className={activeAnalysisTab === "gap" ? "active" : ""} onClick={() => setActiveAnalysisTab("gap")} role="tab" aria-selected={activeAnalysisTab === "gap"} title={t("tooltip.gap")}>
            {t("tab.gap")}
          </button>
        </div>
        <div className="analysis-list" style={{ "--analysis-height": `${analysisHeight ?? defaultAnalysisHeight}px` } as React.CSSProperties} role="tabpanel">
          {activeAnalysisTab === "words" ? (
            wordFrequency.length ? wordFrequency.map((item) => <p key={item.word}>{item.word}: {item.count}</p>) : <p>{t("empty.words")}</p>
          ) : activeAnalysisTab === "coverage" ? coverage.length ? (
            coverage.map((item) => <p key={item.normalizedKeyword}>{item.normalizedKeyword}: {item.marketplaces.join(", ")}</p>)
          ) : (
            <p>{t("empty.coverage")}</p>
          ) : activeAnalysisTab === "actions" ? salesActions.length ? (
            salesActions.map((action) => (
              <p key={action.title}>
                <strong>{action.title}</strong>
                <span>{action.detail}</span>
              </p>
            ))
          ) : (
            <p>{t("empty.actions")}</p>
          ) : (
            <div className="listing-gap-form">
              <input value={listingTitle} onChange={(event) => setListingTitle(event.target.value)} placeholder={t("gap.titlePlaceholder")} aria-label={t("a11y.listingTitle")} />
              <textarea value={listingDescription} onChange={(event) => setListingDescription(event.target.value)} placeholder={t("gap.descPlaceholder")} aria-label={t("a11y.listingDesc")} />
              <button type="button" onClick={analyzeCurrentListingGap} disabled={suggestions.length === 0}>
                {t("action.analyze")}
              </button>
              {listingGapAnalysis ? (
                <div className="listing-gap-results">
                  {listingGapAnalysis.missingHighValueKeywords.length ? (
                    listingGapAnalysis.missingHighValueKeywords.slice(0, 5).map((item) => (
                      <p key={item.normalizedKeyword}>
                        <strong>{item.keyword}</strong>
                        <span>{formatGapReason(item, t)}</span>
                      </p>
                    ))
                  ) : (
                    <p>{t("gap.noGaps")}</p>
                  )}
                </div>
              ) : (
                <p>{t("gap.hint")}</p>
              )}
            </div>
          )}
        </div>
      </div>
      <button type="button" className="panel-resize-handle" onPointerDown={startPanelResize} aria-label={t("a11y.resizePanel")} />
    </section>
  );
}

function sortSuggestionsForDisplay(suggestions: KeywordSuggestion[]): KeywordSuggestion[] {
  return [...suggestions].sort((left, right) => {
    const scoreSort = (right.score?.opportunityScore ?? 0) - (left.score?.opportunityScore ?? 0);
    if (scoreSort !== 0) {
      return scoreSort;
    }

    const occurrenceSort = (right.occurrenceCount ?? 1) - (left.occurrenceCount ?? 1);
    if (occurrenceSort !== 0) {
      return occurrenceSort;
    }

    return (left.bestPosition ?? left.position) - (right.bestPosition ?? right.position) || left.normalizedKeyword.localeCompare(right.normalizedKeyword);
  });
}

function buildSalesActions(suggestions: KeywordSuggestion[], seed: string, t: Translate): SalesAction[] {
  if (suggestions.length === 0) {
    return [];
  }

  const sortedSuggestions = sortSuggestionsForDisplay(suggestions);
  const topSuggestion = sortedSuggestions[0];
  const seedTokens = new Set(normalizeKeyword(seed).split(" ").filter((token) => token.length > 1));
  const repeatedSuggestion = sortedSuggestions.find((suggestion) => (suggestion.occurrenceCount ?? 1) >= 2);
  const longTailSuggestions = sortedSuggestions
    .filter((suggestion) => normalizeKeyword(suggestion.normalizedKeyword || suggestion.keyword).split(" ").filter(Boolean).length >= 3)
    .slice(0, 3);
  const topWords = calculateWordFrequency(suggestions)
    .filter((item) => !seedTokens.has(item.word))
    .slice(0, 4);
  const coverageLeader = compareMarketplaceCoverage(suggestions).find((item) => item.count > 1);
  const actions: SalesAction[] = [];

  if (topSuggestion) {
    actions.push({
      title: t("action.titleLead"),
      detail: t("action.titleLeadDetail", { keyword: topSuggestion.keyword })
    });
  }

  if (longTailSuggestions.length > 0) {
    actions.push({
      title: t("action.longTail"),
      detail: longTailSuggestions.map((suggestion) => suggestion.keyword).join(", ")
    });
  }

  if (repeatedSuggestion) {
    actions.push({
      title: t("action.demandSignal"),
      detail: t("action.demandSignalDetail", { keyword: repeatedSuggestion.keyword, count: repeatedSuggestion.occurrenceCount ?? 1 })
    });
  }

  if (coverageLeader) {
    actions.push({
      title: t("action.coverage"),
      detail: t("action.coverageDetail", { keyword: coverageLeader.normalizedKeyword, marketplaces: coverageLeader.marketplaces.join(", ") })
    });
  }

  if (topWords.length > 0) {
    actions.push({
      title: t("action.searchTerms"),
      detail: topWords.map((item) => item.word).join(", ")
    });
  }

  actions.push(buildAiFitAction(suggestions, t));
  return actions.slice(0, 6);
}

function buildAiFitAction(suggestions: KeywordSuggestion[], t: Translate): SalesAction {
  const repeatedCount = suggestions.filter((suggestion) => (suggestion.occurrenceCount ?? 1) >= 2).length;
  const highScoreCount = suggestions.filter((suggestion) => (suggestion.score?.opportunityScore ?? 0) >= 64).length;
  const coverageCount = compareMarketplaceCoverage(suggestions).filter((item) => item.count > 1).length;
  const fit = suggestions.length >= 20 || highScoreCount >= 3 || coverageCount >= 2 ? "high" : suggestions.length >= 6 || repeatedCount >= 1 ? "medium" : "low";
  const level = fit === "high" ? t("aiFit.high") : fit === "medium" ? t("aiFit.medium") : t("aiFit.low");
  const detail = fit === "high" ? t("action.aiFitHigh") : fit === "medium" ? t("action.aiFitMedium") : t("action.aiFitLow");

  return {
    title: t("action.aiFit", { level }),
    detail
  };
}

function Icon({ name }: { name: IconName }) {
  if (name === "collapse") {
    return (
      <svg className="button-icon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5.5 7.25h4.25V3h1.5v6.25H5.5v-2Zm4.75 3.5h4.25v2h-4.25V17h-1.5v-6.25h5.75v1.5h-4.25v-1.5Z" />
      </svg>
    );
  }

  if (name === "expand") {
    return (
      <svg className="button-icon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4 8.75V4h4.75v1.5H6.56l3.22 3.22-1.06 1.06L5.5 6.56v2.19H4Zm7.28 2.53 1.06-1.06 3.16 3.16v-2.13H17V16h-4.75v-1.5h2.19l-3.16-3.22Z" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg className="button-icon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="m5.78 4.72 4.22 4.22 4.22-4.22 1.06 1.06L11.06 10l4.22 4.22-1.06 1.06L10 11.06l-4.22 4.22-1.06-1.06L8.94 10 4.72 5.78l1.06-1.06Z" />
      </svg>
    );
  }

  if (name === "csv") {
    return (
      <svg className="button-icon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4.5 2.75h7.25L15.5 6.5v10.75h-11V2.75Zm1.5 1.5v11.5h8V7.38h-3.13V4.25H6Zm6.25 1.06V6h.69l-.69-.69ZM7 8.25h5.5v1.25H7V8.25Zm0 2.5h5.5V12H7v-1.25Zm0 2.5h3.75v1.25H7v-1.25Z" />
      </svg>
    );
  }

  if (name === "xlsx") {
    return (
      <svg className="button-icon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3.5 3h9.25L16.5 6.75V17h-13V3ZM5 4.5v11h10V7.63h-3.13V4.5H5Zm8.25 1.06v.69h.69l-.69-.69ZM6.5 8h7v6h-7V8Zm1.25 1.25v1.13h1.69V9.25H7.75Zm2.94 0v1.13h1.56V9.25h-1.56Zm-2.94 2.38v1.12h1.69v-1.12H7.75Zm2.94 0v1.12h1.56v-1.12h-1.56Z" />
      </svg>
    );
  }

  return (
    <svg className="button-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7 3.5h7.5V11H13V5H7V3.5ZM4.5 7H11v9.5H4.5V7Zm1.5 1.5V15h3.5V8.5H6Z" />
    </svg>
  );
}

async function readCollapsedPreference(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(collapseStorageKey);
    return result[collapseStorageKey] === true;
  } catch {
    return false;
  }
}

async function writeCollapsedPreference(value: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ [collapseStorageKey]: value });
  } catch {
    // Ignore storage failures; the panel should still work for the current session.
  }
}

async function readListingGapPreference(marketplaceId: string): Promise<{ title: string; description: string }> {
  try {
    const result = await chrome.storage.local.get(`${listingGapStorageKey}:${marketplaceId}`);
    const value = result[`${listingGapStorageKey}:${marketplaceId}`] as Partial<{ title: string; description: string }> | undefined;
    return {
      title: typeof value?.title === "string" ? value.title : "",
      description: typeof value?.description === "string" ? value.description : ""
    };
  } catch {
    return { title: "", description: "" };
  }
}

async function writeListingGapPreference(marketplaceId: string, value: { title: string; description: string }): Promise<void> {
  try {
    await chrome.storage.local.set({ [`${listingGapStorageKey}:${marketplaceId}`]: value });
  } catch {
    // Ignore storage failures; the listing analysis still works for the current session.
  }
}

async function readSpeedPreference(): Promise<CollectionSpeed> {
  try {
    const result = await chrome.storage.local.get(speedStorageKey);
    const value = result[speedStorageKey];
    return isCollectionSpeed(value) ? value : "balanced";
  } catch {
    return "balanced";
  }
}

async function writeSpeedPreference(value: CollectionSpeed): Promise<void> {
  try {
    await chrome.storage.local.set({ [speedStorageKey]: value });
  } catch {
    // Ignore storage failures; the selected speed still applies for the current session.
  }
}

function isCollectionSpeed(value: unknown): value is CollectionSpeed {
  return value === "fast" || value === "balanced" || value === "reliable";
}

async function readPanelSizePreference(): Promise<PanelSize | null> {
  try {
    const result = await chrome.storage.local.get(panelSizeStorageKey);
    const value = result[panelSizeStorageKey] as Partial<PanelSize> | undefined;
    if (typeof value?.width !== "number" || typeof value.height !== "number") {
      return null;
    }

    return clampPanelSize({ width: value.width, height: value.height });
  } catch {
    return null;
  }
}

async function writePanelSizePreference(value: PanelSize): Promise<void> {
  try {
    await chrome.storage.local.set({ [panelSizeStorageKey]: clampPanelSize(value) });
  } catch {
    // Ignore storage failures; resize still works for the current page session.
  }
}

async function readPanelPositionPreference(): Promise<PanelPosition | null> {
  try {
    const result = await chrome.storage.local.get(panelPositionStorageKey);
    const value = result[panelPositionStorageKey] as Partial<PanelPosition> | undefined;
    if (typeof value?.x !== "number" || typeof value.y !== "number") {
      return null;
    }

    return clampPanelPosition({ x: value.x, y: value.y });
  } catch {
    return null;
  }
}

async function writePanelPositionPreference(value: PanelPosition): Promise<void> {
  try {
    await chrome.storage.local.set({ [panelPositionStorageKey]: clampPanelPosition(value) });
  } catch {
    // Ignore storage failures; drag still works for the current page session.
  }
}

async function readAnalysisHeightPreference(): Promise<number | null> {
  try {
    const result = await chrome.storage.local.get(analysisHeightStorageKey);
    const value = result[analysisHeightStorageKey];
    return typeof value === "number" ? clampAnalysisHeight(value) : null;
  } catch {
    return null;
  }
}

async function writeAnalysisHeightPreference(value: number): Promise<void> {
  try {
    await chrome.storage.local.set({ [analysisHeightStorageKey]: clampAnalysisHeight(value) });
  } catch {
    // Ignore storage failures; resize still works for the current page session.
  }
}

function clampPanelSize(value: PanelSize): PanelSize {
  const maxWidth = Math.max(320, window.innerWidth - 48);
  const maxHeight = Math.max(360, window.innerHeight - 48);
  const minWidth = Math.min(390, maxWidth);
  const minHeight = Math.min(420, maxHeight);

  return {
    width: Math.round(Math.min(Math.max(value.width, minWidth), maxWidth)),
    height: Math.round(Math.min(Math.max(value.height, minHeight), maxHeight))
  };
}

function clampPanelPosition(value: PanelPosition, size?: PanelSize): PanelPosition {
  const panelWidth = size?.width ?? 480;
  const panelHeight = size?.height ?? 760;
  const maxX = Math.max(8, window.innerWidth - panelWidth - 8);
  const maxY = Math.max(8, window.innerHeight - panelHeight - 8);

  return {
    x: Math.round(Math.min(Math.max(value.x, 8), maxX)),
    y: Math.round(Math.min(Math.max(value.y, 8), maxY))
  };
}

function getPanelStyle(size: PanelSize | null, position: PanelPosition | null): React.CSSProperties | undefined {
  if (!size && !position) {
    return undefined;
  }

  return {
    ...(size ?? {}),
    ...(position ? { left: position.x, top: position.y, right: "auto" } : {})
  };
}

function clampAnalysisHeight(value: number): number {
  const maxHeight = Math.max(88, Math.min(260, window.innerHeight - 380));
  return Math.round(Math.min(Math.max(value, 64), maxHeight));
}

function getScoreLevel(score?: number): "high" | "medium" | "low" | "empty" {
  if (score == null) {
    return "empty";
  }
  if (score >= 64) {
    return "high";
  }
  if (score >= 45) {
    return "medium";
  }
  return "low";
}

function getScoreTitle(suggestion: KeywordSuggestion, t: Translate): string {
  const score = suggestion.score;
  if (!score) {
    return t("score.none");
  }

  return [
    `${t("score.opportunity")}: ${score.opportunityScore ?? "-"}`,
    `${t("score.frequency")}: ${score.frequencyScore ?? "-"}`,
    `${t("score.longTail")}: ${score.longTailScore ?? "-"}`,
    `${t("score.coverage")}: ${score.marketplaceCoverageScore ?? "-"}`,
    `${t("score.confidence")}: ${score.confidenceScore ?? "-"}`
  ].join(" | ");
}

function formatGapReason(
  item: { presentInTitle?: boolean; presentInBody?: boolean; opportunityScore?: number; occurrenceCount?: number },
  t: Translate
): string {
  const vars = { opportunity: item.opportunityScore ?? 0, hits: item.occurrenceCount ?? 1 };
  if (item.presentInTitle) {
    return t("gap.reasonInTitle", vars);
  }
  if (item.presentInBody) {
    return t("gap.reasonInBody", vars);
  }
  return t("gap.reasonMissing", vars);
}

async function writeClipboardText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) {
    throw new Error("Clipboard permission was blocked.");
  }
}

function setSearchControlValue(input: MarketplaceSearchControl, value: string): void {
  if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
    const prototype = input instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor?.set) {
      descriptor.set.call(input, value);
    } else {
      input.value = value;
    }
    return;
  }

  input.textContent = value;
}

async function populateSearchInput(input: MarketplaceSearchControl, value: string): Promise<void> {
  input.scrollIntoView({ block: "center", inline: "nearest" });
  input.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }));
  input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  input.click();
  input.focus();
  input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

  await sleep(120);

  const targetInput = findActiveMarketplaceSearchInput(input) ?? input;
  targetInput.scrollIntoView({ block: "center", inline: "nearest" });
  targetInput.focus();
  targetInput.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  setSearchControlValue(targetInput, "");
  targetInput.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward", data: "" }));
  await sleep(80);

  for (const character of value) {
    const nextValue = `${getSearchControlValue(targetInput)}${character}`;
    targetInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: character }));
    targetInput.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, inputType: "insertText", data: character }));
    setSearchControlValue(targetInput, nextValue);
    targetInput.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: character }));
    targetInput.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: character }));
    await sleep(8);
  }

  targetInput.dispatchEvent(new Event("change", { bubbles: true }));
}

function getSearchControlValue(input: MarketplaceSearchControl): string {
  if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
    return input.value;
  }
  return input.textContent ?? "";
}

function findActiveMarketplaceSearchInput(fallbackInput: MarketplaceSearchControl): MarketplaceSearchControl | null {
  const activeElement = getDeepActiveElement();
  if (isMarketplaceSearchControl(activeElement) && isRuntimeSearchInput(activeElement)) {
    return activeElement;
  }

  const candidates = Array.from(document.querySelectorAll("input, textarea, [role='searchbox'], [contenteditable]")).filter((element): element is MarketplaceSearchControl => isMarketplaceSearchControl(element) && isRuntimeSearchInput(element));
  let bestInput: MarketplaceSearchControl | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = scoreRuntimeSearchInput(candidate, fallbackInput);
    if (score > bestScore) {
      bestScore = score;
      bestInput = candidate;
    }
  }

  return bestScore >= 6 ? bestInput : null;
}

function isMarketplaceSearchControl(element: Element | null): element is MarketplaceSearchControl {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || isEditableSearchElement(element);
}

function isEditableSearchElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const role = element.getAttribute("role")?.toLowerCase();
  const contentEditable = element.getAttribute("contenteditable");
  return role === "searchbox" || contentEditable === "" || contentEditable === "true" || element.isContentEditable;
}

function getSearchControlType(input: MarketplaceSearchControl): string {
  if (input instanceof HTMLInputElement) {
    return input.getAttribute("type") || input.type || "text";
  }
  if (input instanceof HTMLTextAreaElement) {
    return "textarea";
  }
  return input.getAttribute("role") || (input.getAttribute("contenteditable") !== null ? "contenteditable" : "");
}

function getSearchControlName(input: MarketplaceSearchControl): string {
  if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
    return input.name;
  }
  return input.getAttribute("name") ?? "";
}

function getSearchControlPlaceholder(input: MarketplaceSearchControl): string {
  if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
    return input.placeholder;
  }
  return input.getAttribute("placeholder") ?? input.getAttribute("aria-placeholder") ?? "";
}

function getDeepActiveElement(): Element | null {
  let activeElement: Element | null = document.activeElement;
  while (activeElement?.shadowRoot?.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement;
  }
  return activeElement;
}

function isRuntimeSearchInput(input: MarketplaceSearchControl): boolean {
  if (input instanceof HTMLInputElement) {
    const type = (input.getAttribute("type") || "text").toLowerCase();
    if (["hidden", "password", "checkbox", "radio", "submit", "button", "file", "range", "date", "month", "number"].includes(type)) {
      return false;
    }
  }
  if ((input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) && (input.disabled || input.readOnly)) {
    return false;
  }
  if (input.getAttribute("aria-disabled") === "true" || input.getAttribute("contenteditable") === "false") {
    return false;
  }

  const style = window.getComputedStyle(input);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }

  const rect = input.getBoundingClientRect();
  return rect.width >= 80 || Boolean(getSearchControlPlaceholder(input).trim());
}

function scoreRuntimeSearchInput(input: MarketplaceSearchControl, fallbackInput: MarketplaceSearchControl): number {
  const form = input.closest("form");
  const owner = input.closest("[role='dialog'], [aria-modal='true'], [class*='modal' i], [class*='search' i], [class*='autocomplete' i]");
  const rect = input.getBoundingClientRect();
  const haystack = normalizeKeyword(
    [
      getSearchControlType(input),
      getSearchControlName(input),
      input.id,
      input.className,
      getSearchControlPlaceholder(input),
      input.getAttribute("aria-label"),
      input.getAttribute("aria-placeholder"),
      input.getAttribute("role"),
      input.getAttribute("data-testid"),
      input.getAttribute("data-test-id"),
      form?.getAttribute("role"),
      form?.getAttribute("action"),
      owner?.className,
      owner?.id
    ]
      .filter(Boolean)
      .join(" ")
  );

  let score = input === fallbackInput ? 1 : 3;
  if (document.activeElement === input) {
    score += 10;
  }
  if (owner) {
    score += 5;
  }
  if (rect.width >= 220) {
    score += 2;
  }
  if (rect.top >= 0 && rect.top <= Math.max(260, window.innerHeight * 0.45)) {
    score += 1;
  }
  if (["search", "arama", "ara", "urun", "kategori", "marka", "keyword", "query"].some((signal) => haystack.includes(normalizeKeyword(signal)))) {
    score += 5;
  }
  if (["email", "mail", "password", "sifre", "coupon", "kupon", "newsletter", "address", "adres", "phone"].some((signal) => haystack.includes(normalizeKeyword(signal)))) {
    score -= 8;
  }

  return score;
}

function getQueueIntervalMs(adapter: MarketplaceAdapter, speedProfile: CollectionSpeedProfile): number {
  return adapter.id === "trendyol" ? speedProfile.trendyolQueueIntervalMs : speedProfile.queueIntervalMs;
}

async function collectSuggestionsForExpansion(adapter: MarketplaceAdapter, expansion: string, input: MarketplaceSearchControl | null, speedProfile: CollectionSpeedProfile): Promise<KeywordSuggestion[]> {
  if (adapter.id === "trendyol") {
    const bridgeSuggestions = filterCollectedSuggestions(await fetchTrendyolSuggestionsThroughPageBridge(expansion, speedProfile.trendyolBridgeTimeoutMs), expansion);
    if (bridgeSuggestions.length > 0) {
      return bridgeSuggestions;
    }
  }

  if (input) {
    await populateSearchInput(input, expansion);
  }
  return waitForSuggestions(adapter, expansion, speedProfile);
}

async function waitForSearchInput(adapter: MarketplaceAdapter): Promise<MarketplaceSearchControl | null> {
  for (const delay of [0, 160, 360, 700, 1200, 2000]) {
    if (delay > 0) {
      await sleep(delay);
    }
    const input = adapter.findSearchInput(document);
    if (input) {
      return input;
    }
  }
  return null;
}

async function fetchTrendyolSuggestionsThroughPageBridge(query: string, timeoutMs: number): Promise<KeywordSuggestion[]> {
  try {
    await ensureTrendyolBridgeInjected();
  } catch {
    return [];
  }

  const requestId = createRequestId();

  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      resolve([]);
    }, timeoutMs);

    function handleMessage(event: MessageEvent<TrendyolBridgeResponse>) {
      const message = event.data;
      if (
        event.source !== window ||
        message?.source !== trendyolBridgeResponseSource ||
        message.type !== trendyolBridgeResponseType ||
        message.requestId !== requestId
      ) {
        return;
      }

      window.clearTimeout(timeoutId);
      window.removeEventListener("message", handleMessage);
      resolve(message.ok ? mapTrendyolApiPayloadToSuggestions(message.payload) : []);
    }

    window.addEventListener("message", handleMessage);
    window.postMessage(
      {
        source: trendyolBridgeRequestSource,
        type: trendyolBridgeRequestType,
        requestId,
        query
      },
      window.location.origin
    );
  });
}

function ensureTrendyolBridgeInjected(): Promise<void> {
  if (document.getElementById(trendyolBridgeScriptId)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.id = trendyolBridgeScriptId;
    script.src = chrome.runtime.getURL("assets/trendyolBridge.js");
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      resolve();
    };
    (document.head || document.documentElement).append(script);
  });
}

function mapTrendyolApiPayloadToSuggestions(payload: unknown): KeywordSuggestion[] {
  const apiPayload = payload as TrendyolSuggestionApiPayload | null;
  const rawItems = [
    ...toArray(apiPayload?.singleSuggestions?.suggestions),
    ...toArray(apiPayload?.suggestions),
    ...toArray(apiPayload?.boutiqueSuggestions)
  ];
  const byNormalizedKeyword = new Map<string, KeywordSuggestion>();
  const collectedAt = new Date().toISOString();

  rawItems.forEach((rawItem, index) => {
    const item = rawItem as TrendyolSuggestionApiItem;
    const keyword = getTrendyolSuggestionText(item);
    const normalizedKeyword = normalizeKeyword(keyword);
    if (!keyword || !normalizedKeyword || byNormalizedKeyword.has(normalizedKeyword)) {
      return;
    }

    byNormalizedKeyword.set(normalizedKeyword, {
      keyword,
      normalizedKeyword,
      marketplace: "trendyol",
      source: "trendyol-autocomplete-api",
      position: getTrendyolSuggestionPosition(item, index),
      collectedAt
    });
  });

  return Array.from(byNormalizedKeyword.values()).sort((left, right) => left.position - right.position || left.normalizedKeyword.localeCompare(right.normalizedKeyword));
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getTrendyolSuggestionText(item: TrendyolSuggestionApiItem): string {
  const value = item.text ?? item.name ?? item.keyword;
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function getTrendyolSuggestionPosition(item: TrendyolSuggestionApiItem, fallbackIndex: number): number {
  return typeof item.position === "number" && Number.isFinite(item.position) ? item.position + 1 : fallbackIndex + 1;
}

function createRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `radar-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function waitForSuggestions(adapter: MarketplaceAdapter, expansion: string, speedProfile: CollectionSpeedProfile): Promise<KeywordSuggestion[]> {
  for (const delay of speedProfile.suggestionDelaysMs) {
    await sleep(delay);
    const suggestions = filterCollectedSuggestions(await adapter.extractSuggestions(document), expansion);
    if (suggestions.length > 0) {
      return suggestions;
    }
  }
  return [];
}

function filterCollectedSuggestions(suggestions: KeywordSuggestion[], expansion: string): KeywordSuggestion[] {
  const normalizedExpansion = normalizeKeyword(expansion);
  return suggestions.filter((suggestion) => {
    const normalizedSuggestion = normalizeKeyword(suggestion.normalizedKeyword || suggestion.keyword);
    return normalizedSuggestion.length > 0 && normalizedSuggestion !== normalizedExpansion;
  });
}

function shouldRequireSeedToken(adapter: MarketplaceAdapter): boolean {
  return adapter.id === "amazon-tr" || adapter.id === "trendyol" || adapter.id === "hepsiburada" || adapter.id === "n11";
}

function isRelevantSuggestion(suggestion: KeywordSuggestion, seed: string, expansion: string): boolean {
  const normalizedSuggestion = normalizeKeyword(suggestion.normalizedKeyword || suggestion.keyword);
  const normalizedSeedTokens = normalizeKeyword(seed).split(" ").filter((token) => token.length > 1);
  const normalizedExpansionTokens = normalizeKeyword(expansion).split(" ").filter((token) => token.length > 1);
  const requiredTokens = normalizedSeedTokens.length > 0 ? normalizedSeedTokens : normalizedExpansionTokens;

  if (requiredTokens.length === 0) {
    return true;
  }

  return requiredTokens.some((token) => normalizedSuggestion.includes(token));
}

const panelExportColumns = [
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

function toPanelCsv(suggestions: KeywordSuggestion[]): string {
  const rows = suggestions.map((suggestion) =>
    [
      suggestion.keyword,
      suggestion.normalizedKeyword,
      suggestion.marketplace,
      suggestion.source,
      suggestion.position,
      suggestion.bestPosition ?? suggestion.position,
      suggestion.occurrenceCount ?? 1,
      suggestion.expansionCount,
      suggestion.score?.frequencyScore,
      suggestion.score?.longTailScore,
      suggestion.score?.marketplaceCoverageScore,
      suggestion.score?.confidenceScore,
      suggestion.score?.opportunityScore,
      suggestion.collectedAt
    ]
      .map(csvEscape)
      .join(",")
  );
  return [panelExportColumns.join(","), ...rows].join("\r\n");
}

function downloadPanelCsv(suggestions: KeywordSuggestion[]): void {
  const blob = new Blob(["\uFEFF", toPanelCsv(suggestions)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "keyword-radar-export.csv";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(value: unknown): string {
  const raw = value == null ? "" : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, "\"\"")}"`;
  }
  return raw;
}
