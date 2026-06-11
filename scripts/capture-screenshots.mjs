/**
 * Captures REAL Chrome Web Store screenshots by driving the actual built
 * extension in Playwright. The panel, adapters and scoring are the real
 * production code; only the marketplace page is a clean, controlled backdrop
 * that replays the user's real collected "kulaklık" keywords through the real
 * adapter (the live sites bot-block automation, and this keeps it reproducible).
 *
 * Output: docs/screenshots/{tr,en}/*.png at 1280x800.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dist = resolve(root, "apps/extension/dist");

// Real keywords the user actually collected for "kulaklık" (Trendyol export).
const KEYWORDS = [
  "Kulak İçi Bluetooth Kulaklık", "Kulak Üstü Bluetooth Kulaklık", "Kablosuz Kulaklık",
  "Bluetooth Kulaklık", "Kablolu Kulaklık", "Mikrofonlu Kulaklık", "Gürültü Engelleyici Kulaklık",
  "Kemik İletimli Kulaklık", "Su Geçirmez Kulaklık", "Oyuncu Kulaklığı", "Kablosuz Gaming Kulaklık",
  "JBL Bluetooth Kulaklık", "Anker Soundcore Liberty 4 NC Bluetooth Kulaklık", "Apple Watch Kulaklık",
  "Huawei Freebuds SE 2 Kulaklık Kılıfı", "Xiaomi Bluetooth Kulaklık", "QCY Kulak Üstü Bluetooth Kulaklık",
  "Kulak İçi Kulaklık", "Kafa Üstü Bluetooth Kulaklık", "Kablosuz Kulaklık 2. Nesil",
  "KZ ZS10 Pro Kulaklık", "Akıllı Saat ve Kulaklık", "Kask Bluetooth Intercom Kulaklık",
  "Klavye Mouse Kulaklık Set", "Asus TUF Gaming H3 Wireless Kulaklık", "Kulaklık Standı",
  "Kulaklık Pedi", "Bluetooth Kulaklık Redmi", "Lenovo Bluetooth Kulaklık", "Kız Çocuk Kulaklık",
  "Logitech G Pro X Kulaklık", "Kulak İçi Gaming Kulaklık", "Kablosuz Oyuncu Kulaklık",
  "Yüksek Sesli Bluetooth Kulaklık", "Airpods Pro 2. Nesil Kulaklık", "Kulaklık Temizleme Kiti",
  "Marshall Kulaklık", "Razer Kulaklık", "Kablosuz Kulak İçi Kulaklık", "Dokunmatik Ekranlı Bluetooth Kulaklık"
];

const MK = {
  trendyol: {
    name: "trendyol",
    label: "pazaryeri",
    placeholder: "Aradığınız ürün, kategori veya markayı yazınız",
    suggestItem: (k) => `<a class="suggestion-result" href="/sr?q=${encodeURIComponent(k)}">${k}</a>`
  },
  hepsiburada: {
    name: "hepsiburada",
    label: "alışveriş",
    placeholder: "Ürün, kategori veya marka ara",
    suggestItem: (k) => `<a class="suggestion-result" href="/ara?q=${encodeURIComponent(k)}">${k}</a>`
  }
};

function stub(mp) {
  const m = MK[mp];
  const suggest = KEYWORDS.map(m.suggestItem).join("");
  const cards = Array.from({ length: 12 }, (_, i) => `<div class="card"><div class="ph"></div><div class="l1"></div><div class="l2"></div><div class="pz">₺${(i + 1) * 149},90</div></div>`).join("");
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;font-family:"Segoe UI",system-ui,Roboto,Arial,sans-serif}
    body{background:#f4f5f7;color:#2b2f33}
    .top{background:#fff;border-bottom:1px solid #e7e9ee;padding:14px 28px;display:flex;align-items:center;gap:22px;position:sticky;top:0}
    .logo{font-size:22px;font-weight:800;color:#1B4DFF;letter-spacing:-.02em;white-space:nowrap}
    .logo small{display:block;font-size:10px;font-weight:600;color:#9aa3ad;letter-spacing:.18em;text-transform:uppercase}
    .searchwrap{position:relative;flex:1;max-width:560px}
    .search-box{width:100%;border:2px solid #1B4DFF;border-radius:10px;padding:12px 16px;font-size:15px;outline:none}
    .mk-suggest{position:absolute;left:0;right:0;top:48px;background:#fff;border:1px solid #e7e9ee;border-radius:10px;
      box-shadow:0 16px 40px rgba(16,30,80,.14);overflow:hidden;z-index:5;max-height:360px;overflow-y:auto}
    .mk-suggest a{display:block;padding:10px 16px;font-size:14px;color:#2b2f33;text-decoration:none;border-bottom:1px solid #f1f2f5}
    .mk-suggest a:hover{background:#f4f7ff}
    .nav{margin-left:auto;display:flex;gap:18px;color:#6b7480;font-size:14px;font-weight:600}
    .grid{padding:26px 28px;display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
    .card{background:#fff;border:1px solid #eef0f4;border-radius:12px;padding:12px}
    .card .ph{height:120px;background:linear-gradient(135deg,#eef1f7,#e3e8f3);border-radius:8px}
    .card .l1{height:10px;background:#eceef3;border-radius:6px;margin:12px 0 7px}
    .card .l2{height:10px;width:65%;background:#eceef3;border-radius:6px}
    .card .pz{margin-top:10px;font-weight:800;color:#1B4DFF;font-size:15px}
  </style></head><body>
    <div class="top">
      <div class="logo">${m.label}<small>marketplace</small></div>
      <div class="searchwrap">
        <input class="search-box" autocomplete="off" placeholder="${m.placeholder}" value="">
        <div class="mk-suggest">${suggest}</div>
      </div>
      <div class="nav"><span>Kampanyalar</span><span>Favoriler</span><span>Sepetim</span></div>
    </div>
    <div class="grid">${cards}</div>
  </body></html>`;
}

const shotDir = (locale) => {
  const d = resolve(root, `docs/screenshots/${locale}`);
  mkdirSync(d, { recursive: true });
  return d;
};

const GAP = {
  tr: { title: "Kablosuz Bluetooth Kulaklık - Mikrofonlu", desc: "Şarjlı, gürültü engelleyici kablosuz kulaklık. Telefon ve tablet uyumlu." },
  en: { title: "Kablosuz Bluetooth Kulaklık - Mikrofonlu", desc: "Şarjlı, gürültü engelleyici kablosuz kulaklık. Telefon ve tablet uyumlu." }
};

async function drive(page) {
  await page.waitForSelector(".seed-field input", { timeout: 20000 });
  const expand = page.locator(".collapsed-expand-button");
  if (await expand.count()) { try { await expand.first().click({ timeout: 1500 }); } catch { /* already open */ } }
  await page.locator(".seed-field input").fill("kulaklık");
  const mode0 = page.locator(".mode-grid input[type=checkbox]").first();
  if (!(await mode0.isChecked())) await mode0.check();
  try { await page.locator(".speed-grid input[type=radio]").first().check(); } catch { /* default speed */ }
  await page.locator(".actions button").first().click();
  await page.waitForSelector(".table-wrap tbody tr", { timeout: 40000 });
  // Wait until the run finishes (the Collect button re-enables when not collecting).
  await page.waitForFunction(
    () => {
      const host = document.getElementById("bluedev-keyword-radar-host");
      const btn = host && host.shadowRoot && host.shadowRoot.querySelector(".actions button");
      return !!btn && !btn.disabled;
    },
    undefined,
    { timeout: 120000 }
  );
  await page.waitForTimeout(600);
  // Tidy the marketplace search box for the screenshot (it holds the last probe).
  await page.locator(".search-box").fill("kulaklık").catch(() => {});
  await page.waitForTimeout(200);
}

async function clickTab(page, idx) {
  await page.locator(".analysis-tabs button").nth(idx).click();
  await page.waitForTimeout(450);
}

const shot = (page, dir, name) =>
  page.screenshot({ path: resolve(dir, name), clip: { x: 0, y: 0, width: 1280, height: 800 } });

const scenarios = [
  { mp: "trendyol", locale: "tr" },
  { mp: "hepsiburada", locale: "tr" },
  { mp: "trendyol", locale: "en" },
  { mp: "hepsiburada", locale: "en" }
];

const ctx = await chromium.launchPersistentContext("", {
  headless: false,
  viewport: { width: 1280, height: 800 },
  // --headless=new keeps the window off the user's screen while still loading the
  // MV3 extension (old headless can't load extensions).
  args: ["--headless=new", `--disable-extensions-except=${dist}`, `--load-extension=${dist}`, "--no-first-run", "--no-default-browser-check"]
});

try {
  let sw = ctx.serviceWorkers()[0];
  if (!sw) sw = await ctx.waitForEvent("serviceworker", { timeout: 15000 });
  console.log("extension service worker:", sw.url());

  for (const { mp, locale } of scenarios) {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await sw.evaluate(
      (loc) => chrome.storage.local.set({ "bluedev-keyword-radar-locale": loc, "bluedev-keyword-radar-collapsed": false }),
      locale
    );
    await page.route("**/*", (route) => {
      const req = route.request();
      if (req.resourceType() === "document") {
        route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: stub(mp) });
      } else {
        route.abort();
      }
    });

    const url = mp === "trendyol" ? "https://www.trendyol.com/sr?q=kulaklik" : "https://www.hepsiburada.com/ara?q=kulaklik";
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const dir = shotDir(locale);
    try {
      await drive(page);
      const tag = mp === "trendyol" ? "01-collect" : "04-hepsiburada";
      await shot(page, dir, `${tag}.png`);
      console.log(`${locale}/${tag}.png`);

      if (mp === "trendyol") {
        await clickTab(page, 2); // actions (sales / SEO tips) — distinct from the default words tab
        await shot(page, dir, "02-analysis.png");
        console.log(`${locale}/02-analysis.png`);

        await clickTab(page, 3); // gap
        await page.locator(".listing-gap-form input").fill(GAP[locale].title);
        await page.locator(".listing-gap-form textarea").fill(GAP[locale].desc);
        await page.locator(".listing-gap-form button").click();
        await page.waitForSelector(".listing-gap-results", { timeout: 10000 });
        await page.waitForTimeout(400);
        // Bring the gap results into frame (the panel is taller than the viewport).
        await page.locator(".analysis-list").evaluate((el) => { el.scrollTop = el.scrollHeight; }).catch(() => {});
        await page.waitForTimeout(300);
        await shot(page, dir, "03-listing-gap.png");
        console.log(`${locale}/03-listing-gap.png`);
      }
    } catch (err) {
      console.error(`FAILED ${mp}/${locale}:`, err.message);
      await shot(page, dir, `_fail-${mp}.png`).catch(() => {});
    }
    await page.close();
  }
} finally {
  await ctx.close();
}
console.log("done");
