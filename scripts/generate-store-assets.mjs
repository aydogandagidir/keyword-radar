/**
 * Generates Chrome Web Store marketing assets ("assets as code"):
 *   - promo tiles: 440x280, 920x680, 1400x560
 *   - store screenshots (designed panel mockups): 1280x800, EN + TR
 *
 * Rendered from HTML/CSS via Playwright's bundled Chromium (already a dev dep),
 * so every asset is reproducible: edit the templates, re-run `pnpm assets`.
 *
 * Output:
 *   marketing/promotional/*.png
 *   docs/screenshots/{en,tr}/*.png
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const iconSvg = readFileSync(resolve(root, "apps/extension/src/assets/icons/icon.svg"), "utf8");

const promoDir = resolve(root, "marketing/promotional");
const shotDir = (locale) => resolve(root, `docs/screenshots/${locale}`);
mkdirSync(promoDir, { recursive: true });
mkdirSync(shotDir("en"), { recursive: true });
mkdirSync(shotDir("tr"), { recursive: true });

const BRAND_CSS = `
  *{margin:0;padding:0;box-sizing:border-box;font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif}
  .stage{display:flex;align-items:center;justify-content:center;overflow:hidden;
    background:radial-gradient(1200px 600px at 18% -10%,#1B4DFF 0%,#15327A 42%,#0A1E66 100%);color:#EAF2FF}
  .logo{filter:drop-shadow(0 10px 24px rgba(0,0,0,.35))}
  .wordmark{font-weight:800;letter-spacing:-.02em}
  .chip{display:inline-flex;align-items:center;gap:8px;background:rgba(143,233,255,.10);
    border:1px solid rgba(143,233,255,.28);border-radius:999px;color:#CFF3FF;white-space:nowrap}
  .dot{width:8px;height:8px;border-radius:50%;background:#6BFFB0;box-shadow:0 0 10px #6BFFB0}
  .muted{color:#9FC0FF}
`;

const i18n = {
  en: {
    tagline: "What Turkish marketplace shoppers actually type.",
    chips: ["Amazon.com.tr · Trendyol · n11", "CSV / XLSX export", "Privacy-first · local only"],
    shotTitle: "Find real demand on Turkish marketplaces",
    shotBullets: ["Expand one seed into dozens of probes", "Score by opportunity (0–100)", "Export CSV / XLSX in one click"],
    status: "Collected",
    seed: "telefon kılıfı",
    cols: ["Keyword", "Hits", "Score"],
    caption: "Live opportunity scores, right on the search page"
  },
  tr: {
    tagline: "Türk pazaryeri alıcılarının gerçekte yazdığı.",
    chips: ["Amazon.com.tr · Trendyol · n11", "CSV / XLSX dışa aktarma", "Gizlilik önce · yalnızca yerel"],
    shotTitle: "Türk pazaryerlerinde gerçek talebi bulun",
    shotBullets: ["Tek tohumu onlarca probe'a genişlet", "Fırsat skoruyla sırala (0–100)", "Tek tıkla CSV / XLSX dışa aktar"],
    status: "Toplandı",
    seed: "telefon kılıfı",
    cols: ["Kelime", "İsabet", "Skor"],
    caption: "Arama sayfasında, canlı fırsat skorları"
  }
};

const sampleRows = [
  { kw: "telefon kılıfı", hits: 6, score: 92, level: "high" },
  { kw: "telefon kılıfı silikon", hits: 4, score: 81, level: "high" },
  { kw: "telefon kılıfı şeffaf", hits: 3, score: 74, level: "mid" },
  { kw: "telefon kılıfı deri", hits: 3, score: 68, level: "mid" },
  { kw: "telefon kılıfı magsafe", hits: 2, score: 57, level: "mid" },
  { kw: "telefon kılıfı çiçekli", hits: 1, score: 39, level: "low" }
];
const scoreColor = { high: "#6BFFB0", mid: "#7FE9FF", low: "#9FC0FF" };

function tileHtml(w, h) {
  const big = w >= 1200;
  const mid = w >= 900;
  const logoSize = mid ? 132 : 92;
  const titleSize = big ? 64 : mid ? 52 : 38;
  const tagSize = big ? 26 : mid ? 22 : 15;
  const chips = big || mid;
  return `<!doctype html><meta charset="utf-8"><style>${BRAND_CSS}
    .stage{width:${w}px;height:${h}px;gap:${mid ? 40 : 22}px;padding:0 ${mid ? 64 : 34}px;text-align:left}
    .logo svg{width:${logoSize}px;height:${logoSize}px}
    .title{font-size:${titleSize}px;font-weight:800;letter-spacing:-.03em;line-height:1.02}
    .accent{color:#8FE9FF}
    .tag{font-size:${tagSize}px;color:#CFE6FF;margin-top:${mid ? 14 : 8}px;max-width:${big ? 760 : 520}px}
    .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:${mid ? 22 : 12}px}
    .chip{font-size:${big ? 16 : 13}px;padding:${big ? "8px 14px" : "5px 10px"}}
    .brand{position:absolute;right:${mid ? 28 : 16}px;bottom:${mid ? 22 : 12}px;font-size:${big ? 18 : 13}px}
  </style>
  <div class="stage" style="position:relative">
    <div class="logo">${iconSvg}</div>
    <div>
      <div class="title">Keyword <span class="accent">Radar</span></div>
      <div class="tag">${i18n.en.tagline}</div>
      ${chips ? `<div class="chips">${i18n.en.chips.map((c) => `<span class="chip"><span class="dot"></span>${c}</span>`).join("")}</div>` : ""}
    </div>
    <div class="brand wordmark muted">Bluedev</div>
  </div>`;
}

function shotHtml(locale) {
  const t = i18n[locale];
  const rows = sampleRows
    .map(
      (r) => `<tr>
        <td class="kw">${r.kw}</td>
        <td class="hits">${r.hits}</td>
        <td><span class="badge" style="color:${scoreColor[r.level]};border-color:${scoreColor[r.level]}44;background:${scoreColor[r.level]}14">${r.score}</span></td>
      </tr>`
    )
    .join("");
  return `<!doctype html><meta charset="utf-8"><style>${BRAND_CSS}
    .stage{width:1280px;height:800px;gap:56px;padding:0 84px;text-align:left}
    .left{max-width:470px}
    .left .logo svg{width:64px;height:64px}
    .left h1{font-size:46px;font-weight:800;letter-spacing:-.03em;line-height:1.05;margin:22px 0 18px}
    .left .accent{color:#8FE9FF}
    .bullets{list-style:none;display:flex;flex-direction:column;gap:14px;font-size:19px;color:#CFE6FF}
    .bullets li{display:flex;align-items:center;gap:12px}
    .cap{margin-top:26px;font-size:15px;color:#9FC0FF}
    .panel{width:430px;background:linear-gradient(180deg,#0E2A6B,#0B1F52);border:1px solid rgba(143,233,255,.18);
      border-radius:18px;box-shadow:0 30px 70px rgba(0,0,0,.45);overflow:hidden}
    .ph{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(143,233,255,.12)}
    .ph .ey{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8FE9FF}
    .ph h2{font-size:18px;font-weight:700}
    .st{font-size:11px;color:#0A1E66;background:#6BFFB0;border-radius:999px;padding:4px 10px;font-weight:700}
    .seed{margin:16px 18px;display:flex;flex-direction:column;gap:6px}
    .seed span{font-size:11px;color:#9FC0FF}
    .seed .box{background:rgba(255,255,255,.06);border:1px solid rgba(143,233,255,.2);border-radius:10px;padding:10px 12px;font-size:14px}
    table{width:calc(100% - 36px);margin:6px 18px 18px;border-collapse:collapse}
    th{text-align:left;font-size:11px;color:#9FC0FF;font-weight:600;padding:6px 8px;border-bottom:1px solid rgba(143,233,255,.14)}
    td{padding:9px 8px;border-bottom:1px solid rgba(143,233,255,.07);font-size:13px}
    td.kw{font-weight:600;color:#EAF2FF}
    td.hits{color:#9FC0FF}
    .badge{font-weight:800;font-size:13px;border:1px solid;border-radius:8px;padding:3px 9px}
  </style>
  <div class="stage">
    <div class="left">
      <div class="logo">${iconSvg}</div>
      <h1>${t.shotTitle.replace("Radar", '<span class="accent">Radar</span>')}</h1>
      <ul class="bullets">${t.shotBullets.map((b) => `<li><span class="dot"></span>${b}</li>`).join("")}</ul>
      <div class="cap">${t.caption}</div>
    </div>
    <div class="panel">
      <div class="ph"><div><div class="ey">Keyword Radar</div><h2>Amazon.com.tr</h2></div><div class="st">${t.status}</div></div>
      <div class="seed"><span>${locale === "tr" ? "Tohum kelime" : "Seed keyword"}</span><div class="box">${t.seed}</div></div>
      <table><thead><tr><th>${t.cols[0]}</th><th>${t.cols[1]}</th><th>${t.cols[2]}</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
  </div>`;
}

const browser = await chromium.launch();
try {
  const tiles = [
    { name: "small-tile-440x280.png", w: 440, h: 280 },
    { name: "large-tile-920x680.png", w: 920, h: 680 },
    { name: "marquee-1400x560.png", w: 1400, h: 560 }
  ];
  for (const tile of tiles) {
    const page = await browser.newPage({ viewport: { width: tile.w, height: tile.h }, deviceScaleFactor: 1 });
    await page.setContent(tileHtml(tile.w, tile.h), { waitUntil: "networkidle" });
    await page.screenshot({ path: resolve(promoDir, tile.name), clip: { x: 0, y: 0, width: tile.w, height: tile.h } });
    await page.close();
    console.log(`promotional/${tile.name}`);
  }
  for (const locale of ["en", "tr"]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await page.setContent(shotHtml(locale), { waitUntil: "networkidle" });
    await page.screenshot({ path: resolve(shotDir(locale), "01-panel.png"), clip: { x: 0, y: 0, width: 1280, height: 800 } });
    await page.close();
    console.log(`screenshots/${locale}/01-panel.png`);
  }
} finally {
  await browser.close();
}
