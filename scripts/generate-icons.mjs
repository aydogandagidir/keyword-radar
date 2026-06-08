/**
 * Renders the extension icon SVG to PNG files at the sizes Chrome requires.
 *
 * Uses Playwright's bundled Chromium (already a dev dependency) so no extra
 * image library is needed. Run with: `pnpm icons` (see root package.json).
 *
 * Source of truth: apps/extension/src/assets/icons/icon.svg
 * Output:          apps/extension/src/assets/icons/icon-{16,32,48,128}.png
 * The Vite build then copies these into dist/assets/icons/ (vite.config.ts).
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const iconDir = resolve(here, "../apps/extension/src/assets/icons");
const svg = readFileSync(resolve(iconDir, "icon.svg"), "utf8");
const sizes = [16, 32, 48, 128];

const browser = await chromium.launch();
try {
  for (const size of sizes) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1
    });
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{width:${size}px;height:${size}px;background:transparent}
      svg{display:block;width:${size}px;height:${size}px}
    </style></head><body>${svg}</body></html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({
      path: resolve(iconDir, `icon-${size}.png`),
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size }
    });
    await page.close();
    console.log(`generated icon-${size}.png`);
  }
} finally {
  await browser.close();
}
