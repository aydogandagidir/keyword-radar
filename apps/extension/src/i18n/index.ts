// Lightweight, runtime-switchable i18n for the content-script panel.
//
// The manifest name/description are localized separately via `_locales/` and
// `chrome.i18n` (static, browser-locale based). This module powers the panel
// UI, which supports a manual Auto / English / Türkçe override persisted in
// chrome.storage — something chrome.i18n alone cannot do at runtime.

export type Locale = "en" | "tr";
export type LocalePref = "auto" | Locale;
type Vars = Record<string, string | number>;

const en = {
  // modes / speeds / status
  "mode.original": "Seed",
  "mode.suffixAlpha": "Keyword + A-Z",
  "mode.prefixAlpha": "A-Z + keyword",
  "mode.suffixNumeric": "Keyword + 0-9",
  "speed.fast": "Fast",
  "speed.balanced": "Balanced",
  "speed.reliable": "Reliable",
  "status.ready": "Ready",
  "status.collecting": "Collecting",
  "status.collected": "Collected",
  "status.error": "Error",
  // header / locale
  "locale.label": "Language",
  "locale.auto": "Auto",
  "a11y.collapse": "Collapse Keyword Radar",
  "a11y.collapseTitle": "Collapse",
  "a11y.close": "Close Keyword Radar",
  "a11y.closeTitle": "Close",
  "a11y.expand": "Expand Keyword Radar",
  "a11y.expandTitle": "Expand",
  "a11y.dragCollapsed": "Drag collapsed Keyword Radar panel",
  // seed + grids
  "field.seed": "Seed keyword",
  "field.seedPlaceholder": "headphones",
  "a11y.modes": "Expansion modes",
  "a11y.speed": "Collection speed",
  // actions
  "action.collect": "Collect",
  "action.stop": "Stop",
  "action.copy": "Copy",
  "action.csv": "CSV",
  "action.xlsx": "XLSX",
  "action.save": "Save",
  "action.saving": "Saving",
  "action.analyze": "Analyze",
  "a11y.copyResults": "Copy results",
  "a11y.exportCsv": "Export CSV",
  "a11y.exportXlsx": "Export XLSX",
  "a11y.saveRun": "Save run",
  "a11y.copyKeyword": "Copy {keyword}",
  "a11y.copyKeywordTitle": "Copy keyword",
  // progress / metrics
  "a11y.progress": "Collection progress",
  "progress.queries": "Queries",
  "a11y.summary": "Collection summary",
  "a11y.exportActions": "Export actions",
  "metric.keywords": "keywords",
  "metric.hits": "hits",
  "metric.queries": "queries",
  // empty / table
  "empty.done": "No matching autocomplete suggestions were found for this run.",
  "empty.idle": "Enter a seed keyword and collect autocomplete suggestions.",
  "table.keyword": "Keyword",
  "table.hits": "Hits",
  "table.score": "Score",
  // analysis
  "a11y.resizeAnalysis": "Resize analysis area",
  "a11y.analysis": "Keyword analysis",
  "tab.words": "Words",
  "tab.coverage": "Coverage",
  "tab.actions": "Actions",
  "tab.gap": "Listing Gap",
  "empty.words": "No words yet",
  "empty.coverage": "No coverage yet",
  "empty.actions": "No actions yet",
  "gap.titlePlaceholder": "Product title",
  "gap.descPlaceholder": "Description or bullet points",
  "a11y.listingTitle": "Listing title",
  "a11y.listingDesc": "Listing description",
  "gap.noGaps": "No high-value gaps found",
  "gap.hint": "Analyze collected keywords against listing copy.",
  "a11y.resizePanel": "Resize Keyword Radar panel",
  // tooltips (hover guidance)
  "tooltip.save": "Save this collection (keywords + scores) locally in your browser, so you can revisit it later.",
  "tooltip.words": "Most frequent single words across all suggestions — the core terms to put in your title and tags.",
  "tooltip.coverage": "Which marketplaces each keyword appears on — higher coverage signals cross-marketplace demand.",
  "tooltip.actions": "Ready-to-use selling / SEO tips derived from the collected data (title lead, long-tail targets, demand signals).",
  "tooltip.gap": "Paste your product title and description; finds which high-value collected keywords are missing from your copy.",
  // notices / errors
  "notice.copied": "Copied",
  "notice.copyFailed": "Copy failed.",
  "notice.keywordCopied": "Keyword copied",
  "notice.csvDownloaded": "CSV downloaded",
  "notice.csvFailed": "CSV export failed.",
  "notice.xlsxDownloaded": "XLSX downloaded",
  "notice.xlsxFailed": "XLSX export failed.",
  "notice.savedLocally": "Saved locally: {count} keywords",
  "notice.saveFailed": "Local save failed.",
  "notice.titleRequired": "Listing title is required.",
  "notice.collectFirst": "Collect keywords before analyzing a listing.",
  "notice.gapAnalyzed": "Listing gap analyzed",
  "error.noSearchInput": "Search input was not found on this page.",
  "error.collectionFailed": "Collection failed."
} satisfies Record<string, string>;

export type MessageKey = keyof typeof en;

const tr: Record<MessageKey, string> = {
  "mode.original": "Tohum",
  "mode.suffixAlpha": "Kelime + A-Z",
  "mode.prefixAlpha": "A-Z + kelime",
  "mode.suffixNumeric": "Kelime + 0-9",
  "speed.fast": "Hızlı",
  "speed.balanced": "Dengeli",
  "speed.reliable": "Güvenilir",
  "status.ready": "Hazır",
  "status.collecting": "Toplanıyor",
  "status.collected": "Toplandı",
  "status.error": "Hata",
  "locale.label": "Dil",
  "locale.auto": "Otomatik",
  "a11y.collapse": "Paneli daralt",
  "a11y.collapseTitle": "Daralt",
  "a11y.close": "Paneli kapat",
  "a11y.closeTitle": "Kapat",
  "a11y.expand": "Paneli genişlet",
  "a11y.expandTitle": "Genişlet",
  "a11y.dragCollapsed": "Daraltılmış paneli sürükle",
  "field.seed": "Tohum kelime",
  "field.seedPlaceholder": "kulaklık",
  "a11y.modes": "Genişletme modları",
  "a11y.speed": "Toplama hızı",
  "action.collect": "Topla",
  "action.stop": "Durdur",
  "action.copy": "Kopyala",
  "action.csv": "CSV",
  "action.xlsx": "XLSX",
  "action.save": "Kaydet",
  "action.saving": "Kaydediliyor",
  "action.analyze": "Analiz et",
  "a11y.copyResults": "Sonuçları kopyala",
  "a11y.exportCsv": "CSV dışa aktar",
  "a11y.exportXlsx": "XLSX dışa aktar",
  "a11y.saveRun": "Çalışmayı kaydet",
  "a11y.copyKeyword": "{keyword} kopyala",
  "a11y.copyKeywordTitle": "Kelimeyi kopyala",
  "a11y.progress": "Toplama ilerlemesi",
  "progress.queries": "Sorgu",
  "a11y.summary": "Toplama özeti",
  "a11y.exportActions": "Dışa aktarma eylemleri",
  "metric.keywords": "kelime",
  "metric.hits": "isabet",
  "metric.queries": "sorgu",
  "empty.done": "Bu çalışma için eşleşen otomatik tamamlama önerisi bulunamadı.",
  "empty.idle": "Bir tohum kelime girin ve otomatik tamamlama önerilerini toplayın.",
  "table.keyword": "Kelime",
  "table.hits": "İsabet",
  "table.score": "Skor",
  "a11y.resizeAnalysis": "Analiz alanını yeniden boyutlandır",
  "a11y.analysis": "Kelime analizi",
  "tab.words": "Kelimeler",
  "tab.coverage": "Kapsam",
  "tab.actions": "Aksiyonlar",
  "tab.gap": "Liste Açığı",
  "empty.words": "Henüz kelime yok",
  "empty.coverage": "Henüz kapsam yok",
  "empty.actions": "Henüz aksiyon yok",
  "gap.titlePlaceholder": "Ürün başlığı",
  "gap.descPlaceholder": "Açıklama veya madde işaretleri",
  "a11y.listingTitle": "Liste başlığı",
  "a11y.listingDesc": "Liste açıklaması",
  "gap.noGaps": "Yüksek değerli açık bulunamadı",
  "gap.hint": "Toplanan kelimeleri liste metniyle karşılaştırın.",
  "a11y.resizePanel": "Paneli yeniden boyutlandır",
  "tooltip.save": "Bu toplama oturumunu (kelimeler + skorlar) tarayıcında yerel kaydet; sonra geri yükleyebilirsin.",
  "tooltip.words": "Tüm öneriler içinde en sık geçen tekil kelimeler — başlık ve etiketlere koyacağın çekirdek terimler.",
  "tooltip.coverage": "Her kelimenin hangi pazaryerlerinde göründüğü — yüksek kapsam, çok pazaryerli talep demektir.",
  "tooltip.actions": "Toplanan veriden çıkarılan, kullanıma hazır satış / SEO ipuçları (başlık önceliği, uzun-kuyruk hedefler, talep sinyalleri).",
  "tooltip.gap": "Ürün başlığını ve açıklamanı yapıştır; toplanan yüksek-değerli kelimelerden hangilerinin metninde eksik olduğunu bulur.",
  "notice.copied": "Kopyalandı",
  "notice.copyFailed": "Kopyalama başarısız.",
  "notice.keywordCopied": "Kelime kopyalandı",
  "notice.csvDownloaded": "CSV indirildi",
  "notice.csvFailed": "CSV dışa aktarma başarısız.",
  "notice.xlsxDownloaded": "XLSX indirildi",
  "notice.xlsxFailed": "XLSX dışa aktarma başarısız.",
  "notice.savedLocally": "Yerel kaydedildi: {count} kelime",
  "notice.saveFailed": "Yerel kayıt başarısız.",
  "notice.titleRequired": "Liste başlığı gerekli.",
  "notice.collectFirst": "Bir listeyi analiz etmeden önce kelime toplayın.",
  "notice.gapAnalyzed": "Liste açığı analiz edildi",
  "error.noSearchInput": "Bu sayfada arama kutusu bulunamadı.",
  "error.collectionFailed": "Toplama başarısız."
};

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, tr };

export const LOCALE_STORAGE_KEY = "bluedev-keyword-radar-locale";

export function resolveLocale(pref: LocalePref): Locale {
  if (pref === "en" || pref === "tr") return pref;
  const lang = (globalThis.navigator?.language ?? "en").toLowerCase();
  return lang.startsWith("tr") ? "tr" : "en";
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}

export type Translate = (key: MessageKey, vars?: Vars) => string;

export function createTranslator(locale: Locale): Translate {
  const dict = dictionaries[locale];
  return (key, vars) => interpolate(dict[key] ?? en[key], vars);
}

export async function readLocalePref(): Promise<LocalePref> {
  try {
    const result = await chrome.storage.local.get(LOCALE_STORAGE_KEY);
    const value = result[LOCALE_STORAGE_KEY];
    return value === "en" || value === "tr" || value === "auto" ? value : "auto";
  } catch {
    return "auto";
  }
}

export async function writeLocalePref(pref: LocalePref): Promise<void> {
  try {
    await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: pref });
  } catch {
    // best-effort persistence
  }
}
