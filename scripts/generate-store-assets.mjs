/**
 * Generates Chrome Web Store promotional tiles ("assets as code"):
 *   - promo tiles: 440x280, 920x680, 1400x560
 *
 * Rendered from HTML/CSS via Playwright's bundled Chromium (already a dev dep),
 * so every asset is reproducible: edit the template, re-run `pnpm assets`.
 *
 * Store *screenshots* (docs/screenshots/{en,tr}/) are captured separately from
 * the REAL extension by `scripts/capture-screenshots.mjs` — not mocked here.
 *
 * Output: marketing/promotional/*.png
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const iconSvg = readFileSync(resolve(root, "apps/extension/src/assets/icons/icon.svg"), "utf8");

const promoDir = resolve(root, "marketing/promotional");
mkdirSync(promoDir, { recursive: true });

const tagline = "What Turkish marketplace shoppers actually type.";
const chips = ["Amazon.com.tr · Trendyol · Hepsiburada · n11", "CSV / XLSX export", "Privacy-first · local only"];

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

function tileHtml(w, h) {
  const big = w >= 1200;
  const mid = w >= 900;
  const logoSize = mid ? 132 : 92;
  const titleSize = big ? 64 : mid ? 52 : 38;
  const tagSize = big ? 26 : mid ? 22 : 15;
  const showChips = big || mid;
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
      <div class="tag">${tagline}</div>
      ${showChips ? `<div class="chips">${chips.map((c) => `<span class="chip"><span class="dot"></span>${c}</span>`).join("")}</div>` : ""}
    </div>
    <div class="brand wordmark muted">Bluedev</div>
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
} finally {
  await browser.close();
}
