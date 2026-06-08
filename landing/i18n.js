// Tiny bilingual switcher for the landing page (TR default, EN optional).
// Uses data-i18n (textContent), data-i18n-html (innerHTML), data-i18n-src (img src).
(function () {
  "use strict";

  var DICT = {
    tr: {
      "nav.features": "Özellikler",
      "nav.marketplaces": "Pazaryerleri",
      "nav.privacy": "Gizlilik",
      "hero.title": 'Türk pazaryeri alıcılarının <span class="accent">gerçekte aradığını</span> keşfedin.',
      "hero.lead": "Tek bir tohum kelime yazın; Keyword Radar Amazon.com.tr, Trendyol ve n11'deki görünür otomatik tamamlama önerilerini toplar, normalize eder, skorlar ve CSV/XLSX olarak dışa aktarır.",
      "cta.github": "GitHub'da Aç",
      "cta.soon": "Chrome Web Store · yakında",
      "hero.note": "Hesap yok · giriş yok · veriler cihazınızda kalır.",
      "hero.shot": "assets/screenshot-tr.png",
      "feat.title": "Ne yapar?",
      "feat.expand.t": "Tohum genişletme",
      "feat.expand.d": "Orijinal, sonek A–Z, önek A–Z ve sonek 0–9 modlarıyla tek kelimeyi onlarca probe'a çevirin.",
      "feat.visible.t": "Yalnızca görünür",
      "feat.visible.d": "Yalnızca canlı otomatik tamamlama listesini okur — gizli uç nokta yok, özel veri kazıma yok.",
      "feat.score.t": "Fırsat skoru",
      "feat.score.d": "Frekans, uzun-kuyruk, pazaryeri kapsamı ve güveni tek bir 0–100 skorunda birleştirir.",
      "feat.gap.t": "Listing gap",
      "feat.gap.d": "Toplanan kelimeleri ürün başlığınız ve açıklamanızla karşılaştırın, eksikleri görün.",
      "feat.export.t": "CSV / XLSX",
      "feat.export.d": "Tek tıkla CSV (Excel uyumlu) ve çok-sayfalı XLSX dışa aktarın; çalışmaları yerel kaydedin.",
      "feat.tr.t": "Türkçe-duyarlı",
      "feat.tr.d": "ç ğ ı ö ş ü içeren varyantlar bölünmek yerine doğru birleşir. Arayüz TR/EN.",
      "mkt.title": "Desteklenen pazaryerleri",
      "mkt.desc": "İlk sürüm kapsamı. Hepsiburada ve global pazaryeri adaptörleri kodda hazır, autocomplete güvenilir olunca açılacak.",
      "privacy.title": "Tasarımı gereği gizli",
      "privacy.desc": 'Harici sunucu, analitik veya telemetri yok. İzinler yalnızca activeTab + storage; erişim yalnızca üç pazaryeri. Toplama yalnızca siz "Topla"ya bastığınızda çalışır.',
      "privacy.link": "Gizlilik Politikası",
      "footer.disclaimer": "Keyword Radar, <strong>Bluedev</strong>'in bağımsız bir aracıdır. Amazon, Trendyol veya n11 ile ilişkili değildir; markalar ilgili sahiplerine aittir."
    },
    en: {
      "nav.features": "Features",
      "nav.marketplaces": "Marketplaces",
      "nav.privacy": "Privacy",
      "hero.title": 'Discover what Turkish marketplace shoppers <span class="accent">actually search for</span>.',
      "hero.lead": "Type one seed keyword; Keyword Radar collects the visible autocomplete suggestions on Amazon.com.tr, Trendyol and n11, then normalizes, scores and exports them as CSV/XLSX.",
      "cta.github": "Open on GitHub",
      "cta.soon": "Chrome Web Store · soon",
      "hero.note": "No account · no login · data stays on your device.",
      "hero.shot": "assets/screenshot-en.png",
      "feat.title": "What it does",
      "feat.expand.t": "Seed expansion",
      "feat.expand.d": "Turn one keyword into dozens of probes — original, suffix A–Z, prefix A–Z and suffix 0–9 modes.",
      "feat.visible.t": "Visible-only",
      "feat.visible.d": "Reads only the live autocomplete dropdown — no hidden endpoints, no scraping of private data.",
      "feat.score.t": "Opportunity score",
      "feat.score.d": "Frequency, long-tail, marketplace coverage and confidence combined into a single 0–100 score.",
      "feat.gap.t": "Listing gap",
      "feat.gap.d": "Compare collected keywords against your product title and description to find what's missing.",
      "feat.export.t": "CSV / XLSX",
      "feat.export.d": "One-click CSV (Excel-friendly) and multi-sheet XLSX export; keep runs saved locally.",
      "feat.tr.t": "Turkish-aware",
      "feat.tr.d": "Variants with ç ğ ı ö ş ü collapse correctly instead of fragmenting. UI in TR/EN.",
      "mkt.title": "Supported marketplaces",
      "mkt.desc": "First release scope. Hepsiburada and global marketplace adapters are in the codebase, gated until their autocomplete is reliable.",
      "privacy.title": "Private by design",
      "privacy.desc": 'No external servers, analytics or telemetry. Permissions are limited to activeTab + storage; access is limited to the three marketplaces. Collection runs only when you click "Collect".',
      "privacy.link": "Privacy Policy",
      "footer.disclaimer": "Keyword Radar is an independent tool by <strong>Bluedev</strong>. Not affiliated with Amazon, Trendyol or n11; trademarks belong to their owners."
    }
  };

  function apply(lang) {
    var dict = DICT[lang] || DICT.tr;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n")];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-html")];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-src]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-src")];
      if (v != null) el.setAttribute("src", v);
    });
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });
    try {
      localStorage.setItem("kr-lang", lang);
    } catch (_e) {
      /* ignore */
    }
  }

  var stored = null;
  try {
    stored = localStorage.getItem("kr-lang");
  } catch (_e) {
    /* ignore */
  }
  var initial = stored || ((navigator.language || "tr").toLowerCase().indexOf("tr") === 0 ? "tr" : "en");

  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () {
      apply(b.getAttribute("data-lang"));
    });
  });

  apply(initial);
})();
