# Changelog

Tüm önemli değişiklikler bu dosyada belgelenir.
Format [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) standardına, sürümleme [SemVer](https://semver.org/lang/tr/) kurallarına dayanır.

## [Yayınlanmamış]

Chrome Web Store ilk gönderimine hazırlık. Henüz mağazada yayınlanmadı.

### ✨ Eklendi
- İki dilli dökümantasyon: `README.md` (TR) + `README.en.md` (EN), `LICENSE` (Proprietary, EN+TR), kök `PRIVACY.md`, bu `CHANGELOG.md`.
- **İki dilli arayüz (i18n):** manifest `_locales` (EN/TR ad/açıklama, `__MSG_*__`) + panelde runtime **Auto / EN / TR** dil seçici (TS sözlük + `t()`, tercih `chrome.storage`'da). _Not: üretilen satış ipuçları ve skor tooltip'i sonraki turda çevrilecek; desen hazır._
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
