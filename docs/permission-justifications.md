# Permission Justifications — Keyword Radar

Reference for the Chrome Web Store "Permission justification" and "Data usage" fields.
Each entry is provided in English and Turkish.

## `activeTab`

**EN:** Used to interact with the marketplace tab the user is actively viewing — showing/hiding the floating panel and typing the user's seed-keyword probes into that page's own search box when the user clicks "Collect". No other tabs are accessed.

**TR:** Kullanıcının aktif olarak görüntülediği pazaryeri sekmesiyle etkileşim için kullanılır — yüzen paneli gösterme/gizleme ve kullanıcı "Topla"ya bastığında tohum-kelime probe'larını o sayfanın kendi arama kutusuna yazma. Başka hiçbir sekmeye erişilmez.

## `storage`

**EN:** Used to store the user's own preferences and results locally via `chrome.storage.local`: panel size/position, collapsed state, speed profile, language preference, the Listing-Gap form text, and saved keyword runs. Nothing is transmitted off the device.

**TR:** Kullanıcının kendi tercihlerini ve sonuçlarını `chrome.storage.local` ile yerel olarak saklamak için kullanılır: panel boyutu/konumu, daraltılmış durum, hız profili, dil tercihi, Listing-Gap form metni ve kaydedilen kelime çalışmaları. Cihaz dışına hiçbir şey gönderilmez.

## Host permissions — `amazon.com.tr`, `trendyol.com`, `hepsiburada.com`, `n11.com`

**EN:** Required so the content script can run on these four marketplace search pages to (a) show the panel and (b) read the VISIBLE autocomplete suggestions the page renders. These are the extension's only supported sites; no broad host access (no `<all_urls>`) is requested.

**TR:** İçerik betiğinin bu dört pazaryeri arama sayfasında çalışıp (a) paneli göstermesi ve (b) sayfanın oluşturduğu GÖRÜNÜR otomatik tamamlama önerilerini okuması için gereklidir. Bunlar eklentinin desteklediği tek sitelerdir; geniş host erişimi (`<all_urls>`) istenmez.

## What is NOT requested

`tabs`, `webRequest`, `cookies`, `history`, `<all_urls>`, background/host access to any non-marketplace domain — none of these are requested. The extension makes **no external network requests** of its own.

---

## Data usage disclosure (CWS dashboard)

- **Does the item collect or use user data?** The extension reads **website content** (the visible autocomplete suggestion text) on the supported marketplace pages, and stores the user's own settings/results **locally**. It does **not** transmit any user data off the device — no servers, analytics, or telemetry.
- **Personally identifiable / authentication / financial / health / location / web-history / personal-communications data:** None collected or transmitted.
- **Certifications (all true):**
  - ✅ I do **not** sell or transfer user data to third parties (outside approved use cases).
  - ✅ I do **not** use or transfer user data for purposes unrelated to the item's single purpose.
  - ✅ I do **not** use or transfer user data to determine creditworthiness or for lending purposes.

## Privacy policy URL

Provide the live, product-specific privacy page (see `landing/privacy.html` once deployed),
e.g. `https://bluedev.dev/keyword-radar/privacy`. The repository's [`PRIVACY.md`](../PRIVACY.md) is the source of truth for its content.
