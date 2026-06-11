# Changelog

Tüm önemli değişiklikler bu dosyada belgelenir.
Format [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) standardına, sürümleme [SemVer](https://semver.org/lang/tr/) kurallarına dayanır.

## [Yayınlanmamış]

Chrome Web Store ilk gönderimine hazırlık. Henüz mağazada yayınlanmadı.

### ✨ Eklendi
- İki dilli dökümantasyon: `README.md` (TR) + `README.en.md` (EN), `LICENSE` (Proprietary, EN+TR), kök `PRIVACY.md`, bu `CHANGELOG.md`.
- **İki dilli arayüz (i18n):** manifest `_locales` (EN/TR ad/açıklama, `__MSG_*__`) + panelde runtime **Auto / EN / TR** dil seçici (TS sözlük + `t()`, tercih `chrome.storage`'da). Panel **tamamen** yerelleştirildi: satış aksiyonları, skor tooltip'i, listing-gap gerekçeleri, toast ve hata mesajları dahil.
- **CWS başvuru dökümanları:** `docs/store-listing-{en,tr}.md`, `docs/permission-justifications.md` (TR+EN), `docs/CWS-SUBMISSION-CHECKLIST.md`.
- **Mağaza varlıkları + landing:** promo tile'lar (440×280 / 920×680 / 1400×560) + 1280×800 panel mockup ekran görüntüleri (EN/TR), Playwright ile üretilir (`pnpm assets`); iki dilli landing page (`landing/`, Vercel, Open Graph, gizlilik sayfası).
- **World-class XLSX raporu:** markalı **Summary** sayfası — metrik kartları + hücre-içi **veri çubuğu (data bar) "grafik" tabloları** (Top Fırsatlar, skor dağılımı, pazaryeri kırılımı, en sık kelimeler) — ve **Keywords** sayfasında skor ısı-haritası (renk skalası) + Opportunity data bar. `xlsx-entry` artık `@bluedev/export`'u kullanıyor (tek builder, DRY).
- **Panel tooltip'leri:** Save butonu ve Words / Coverage / Actions / Listing Gap sekmelerine hover açıklamaları (TR/EN, `chrome.i18n` sözlüğü).
- **Hepsiburada desteği:** Hepsiburada, dördüncü pazaryeri olarak CWS kapsamına eklendi — manifest host izinleri + `cwsMarketplaceAdapters` + kapsam guard'ları (test + paketleme script'i) güncellendi.
- **Gerçek görseller + demo videosu (assets-as-code):** gerçek eklentiyi Playwright ile sürüp kaydeden capture script'leri — `scripts/capture-screenshots.mjs` (`pnpm shots`) ve `scripts/capture-demo.mjs` (`pnpm demo`); 4 gerçek 1280×800 mağaza ekran görüntüsü (`docs/screenshots/{tr,en}`, mockup yerine) + 44 sn'lik markalı hibrit demo videosu (`marketing/video/`, intro/outro + gerçek tur + XLSX rapor analizi). bluedev.dev ürün sayfasına eklendi.
- **Gerçek mağaza ekran görüntüleri:** mockup yerine — Playwright ile yüklenen **gerçek eklenti** + gerçek "kulaklık" verisiyle 1280×800 görüntüler (TR + EN: toplama, aksiyonlar, listing gap, Hepsiburada); `scripts/capture-screenshots.mjs` ile üretilir. Promo tile'lar dört pazaryerini yansıtacak şekilde güncellendi.
- Eklenti ikon seti (Figma'da tasarlanan radar logosu → 16/32/48/128 PNG).
- ESLint 9 (flat) + Prettier; GitHub Actions CI (typecheck → lint → test → build).
- Chrome Web Store yayınlama için yerel MCP sunucusu (`tools/cws-publish-mcp`).

### 🗑️ Kaldırıldı
- Paketlenen eklentiden ölü popup kodu (`src/popup/*`) — `action` zaten panel toggle kullanıyor.

---

## [0.1.0] — 2026-06-08

First MVP. Core keyword collection, scoring, and export for Turkish marketplaces.

İlk MVP. Türk pazaryerleri (Amazon.com.tr, Trendyol, n11) için kullanıcı tetiklemeli keyword toplama, skorlama ve dışa aktarma.

### ✨ Eklendi

#### Keyword toplama
- **Tohum genişletme** — orijinal, sonek A–Z, önek A–Z, sonek 0–9 modları.
- **Görünür-öneri toplama** — yalnızca canlı autocomplete listesi okunur; gizli uç nokta yok.
- **Pazaryeri adaptörleri** — Amazon.com.tr, Trendyol, n11; stabil-ID-öncelikli seçiciler + seçici sürüklenmesine karşı skorlu genel fallback.
- **Türkçe/İngilizce normalizasyon** — `ç ğ ı ö ş ü` farkındalıklı tekilleştirme.
- **Hız profilleri** — Fast / Balanced / Reliable (throttle aralıkları).

#### Skorlama & analiz
- **Fırsat skoru** (0–100) — frekans + uzun-kuyruk + pazaryeri kapsamı + güven.
- **Listing gap** analizi (başlık/açıklama vs toplanan keyword'ler).
- **Kelime frekansı** ve **pazaryeri kapsam** matrisi.

#### Dışa aktarma
- **CSV** (Excel-TR uyumlu UTF-8 BOM) ve çok-sayfalı **XLSX** (özet / keyword / analiz / gap), ExcelJS lazy-loaded.
- Yerel **kayıtlı çalışmalar** (`chrome.storage.local`, pazaryeri bazlı).

#### Eklenti
- **Manifest V3**, Shadow-DOM içine enjekte edilen sürüklenebilir/yeniden boyutlandırılabilir React panel.
- Araç çubuğu ikonuyla panel aç/kapa (service worker → `KEYWORD_RADAR_TOGGLE_PANEL`).
- Dar izinler: yalnızca `activeTab` + `storage`; host izinleri 3 pazaryeriyle sınırlı.

#### Mimari
- **pnpm monorepo** — `apps/{extension,web}` + `packages/{shared-types,core,adapters,scoring,export,config}`.
- Strict **TypeScript**, **Vite** (eklenti), opsiyonel geliştirici-içi **Next.js** backend.
- Birim testleri (Vitest) + Playwright smoke; manifest kapsam doğrulaması (`tests/manifest.test.ts`).

### 📦 Build
- `pnpm package:extension` ile Chrome Web Store-ready ZIP; paketleme sırasında manifest kapsam doğrulaması (yalnız TR pazaryerleri).

---

[Yayınlanmamış]: https://github.com/aydogandagidir/keyword-radar/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/aydogandagidir/keyword-radar/releases/tag/v0.1.0
