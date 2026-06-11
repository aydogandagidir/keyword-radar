/**
 * World-class HYBRID product demo video (Turkish), captured from the REAL extension.
 *
 *   1. Branded animated intro.
 *   2. Real product walkthrough on a controlled marketplace backdrop that replays the
 *      user's real "kulaklık" keywords through the real adapter — every feature shown
 *      with a "what + why" caption (seed, scoring, Words, Coverage, Actions, Listing Gap).
 *   3. XLSX export → a branded "Excel report" scene built from the REAL collected rows
 *      (metric cards + Top-opportunities data-bar chart + score heatmap) = analyse the output.
 *   4. Branded animated outro.
 *
 * webm (Playwright) -> mp4 (ffmpeg). Output: marketing/video/keyword-radar-demo.mp4
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dist = resolve(root, "apps/extension/dist");
const iconSvg = readFileSync(resolve(root, "apps/extension/src/assets/icons/icon.svg"), "utf8");
const outDir = resolve(root, "marketing/video");
const rawDir = resolve(outDir, "_raw");
mkdirSync(rawDir, { recursive: true });

const KEYWORDS = [
  "Kulak İçi Bluetooth Kulaklık", "Kulak Üstü Bluetooth Kulaklık", "Kablosuz Kulaklık",
  "Bluetooth Kulaklık", "Kablolu Kulaklık", "Mikrofonlu Kulaklık", "Gürültü Engelleyici Kulaklık",
  "Kemik İletimli Kulaklık", "Su Geçirmez Kulaklık", "Oyuncu Kulaklığı", "Kablosuz Gaming Kulaklık",
  "JBL Bluetooth Kulaklık", "Anker Soundcore Liberty 4 NC Kulaklık", "Apple Watch Kulaklık",
  "Huawei Freebuds SE 2 Kulaklık", "Xiaomi Bluetooth Kulaklık", "QCY Kulak Üstü Kulaklık",
  "Kulak İçi Kulaklık", "Kafa Üstü Bluetooth Kulaklık", "Kablosuz Kulaklık 2. Nesil",
  "KZ ZS10 Pro Kulaklık", "Akıllı Saat ve Kulaklık", "Kask Bluetooth Kulaklık",
  "Klavye Mouse Kulaklık Set", "Asus TUF Gaming Kulaklık", "Kulaklık Standı",
  "Bluetooth Kulaklık Redmi", "Lenovo Bluetooth Kulaklık", "Kız Çocuk Kulaklık",
  "Logitech G Pro X Kulaklık", "Kulak İçi Gaming Kulaklık", "Kablosuz Oyuncu Kulaklık",
  "Yüksek Sesli Bluetooth Kulaklık", "Airpods Pro 2. Nesil Kulaklık", "Marshall Kulaklık",
  "Razer Kulaklık", "Kablosuz Kulak İçi Kulaklık", "Su Geçirmez Yüzücü Kulaklık"
];

function stubHtml() {
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
      box-shadow:0 16px 40px rgba(16,30,80,.14);overflow:hidden;z-index:5;max-height:330px;overflow-y:auto}
    .mk-suggest a{display:block;padding:10px 16px;font-size:14px;color:#2b2f33;text-decoration:none;border-bottom:1px solid #f1f2f5}
    .nav{margin-left:auto;display:flex;gap:18px;color:#6b7480;font-size:14px;font-weight:600}
    .grid{padding:26px 28px;display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
    .card{background:#fff;border:1px solid #eef0f4;border-radius:12px;padding:12px}
    .card .ph{height:120px;background:linear-gradient(135deg,#eef1f7,#e3e8f3);border-radius:8px}
    .card .l1{height:10px;background:#eceef3;border-radius:6px;margin:12px 0 7px}
    .card .l2{height:10px;width:65%;background:#eceef3;border-radius:6px}
    .card .pz{margin-top:10px;font-weight:800;color:#1B4DFF;font-size:15px}
  </style></head><body>
    <div class="top">
      <div class="logo">pazaryeri<small>marketplace</small></div>
      <div class="searchwrap">
        <input class="search-box" autocomplete="off" placeholder="Aradığınız ürün, kategori veya markayı yazınız" value="">
        <div class="mk-suggest"></div>
      </div>
      <div class="nav"><span>Kampanyalar</span><span>Favoriler</span><span>Sepetim</span></div>
    </div>
    <div class="grid">${cards}</div>
    <script>
      const ALL = ${JSON.stringify(KEYWORDS)};
      const input = document.querySelector(".search-box");
      const box = document.querySelector(".mk-suggest");
      let tick = 0;
      function render() {
        const v = (input.value || "").trim().toLocaleLowerCase("tr");
        let list;
        if (!v || v.length < 9) {
          const start = (tick * 3) % ALL.length;
          list = Array.from({ length: 8 }, (_, i) => ALL[(start + i) % ALL.length]);
        } else {
          list = ALL.filter((k) => k.toLocaleLowerCase("tr").includes(v)).slice(0, 8);
          if (!list.length) list = ALL.slice(0, 6);
        }
        box.innerHTML = list.map((k) => '<a class="suggestion-result" href="/sr?q=' + encodeURIComponent(k) + '">' + k + "</a>").join("");
        tick++;
      }
      input.addEventListener("input", render);
      render();
    </script>
  </body></html>`;
}

const BRAND_STYLE = `
  @keyframes kr-pop { 0%{opacity:0;transform:translateY(18px) scale(.96)} 100%{opacity:1;transform:none} }
  @keyframes kr-fade { 0%{opacity:0} 100%{opacity:1} }
  @keyframes kr-grow { 0%{width:0} 100%{} }
  #kr-stage,#kr-report{position:fixed;inset:0;z-index:2147483646;transition:opacity .55s ease}
  #kr-stage{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center;
    background:#0A1E66 radial-gradient(1200px 600px at 18% -10%,#1B4DFF 0%,#15327A 44%,#0A1E66 100%);color:#EAF2FF;
    font-family:"Segoe UI",system-ui,Roboto,Arial,sans-serif}
  #kr-stage .logo{width:120px;height:120px;filter:drop-shadow(0 12px 30px rgba(0,0,0,.4));animation:kr-pop .7s ease both}
  #kr-stage .title{font-size:52px;font-weight:800;letter-spacing:-.03em;animation:kr-pop .7s .08s ease both}
  #kr-stage .title .accent{color:#8FE9FF}
  #kr-stage .tag{font-size:23px;color:#CFE6FF;max-width:780px;line-height:1.4;animation:kr-pop .7s .18s ease both}
  #kr-stage .chips{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:6px;animation:kr-pop .7s .28s ease both}
  #kr-stage .chip{display:inline-flex;align-items:center;gap:8px;background:rgba(143,233,255,.10);border:1px solid rgba(143,233,255,.30);
    border-radius:999px;color:#CFF3FF;padding:8px 16px;font-size:15px;font-weight:600}
  #kr-stage .dot{width:8px;height:8px;border-radius:50%;background:#6BFFB0;box-shadow:0 0 10px #6BFFB0}
  #kr-stage .brand{position:absolute;bottom:30px;font-size:16px;color:#9FC0FF;font-weight:700;animation:kr-fade 1s .5s ease both}
  /* report scene */
  #kr-report{background:#0A1E66;display:flex;align-items:center;justify-content:center;font-family:"Segoe UI",system-ui,Arial,sans-serif}
  #kr-report .sheet{width:1080px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.5);animation:kr-pop .6s ease both}
  #kr-report .rhead{background:#15327A;color:#fff;padding:18px 26px;display:flex;align-items:center;gap:14px}
  #kr-report .rhead .rlogo{width:34px;height:34px}
  #kr-report .rhead b{font-size:20px;font-weight:800}
  #kr-report .rhead span{margin-left:auto;font-size:13px;color:#AFC6FF;font-weight:600}
  #kr-report .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:20px 26px 6px}
  #kr-report .mc{background:#EFF4FF;border:1px solid #D6E2FA;border-radius:10px;padding:14px 16px}
  #kr-report .mc b{display:block;font-size:30px;font-weight:800;color:#15327A;line-height:1}
  #kr-report .mc small{display:block;margin-top:6px;font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:.04em}
  #kr-report .sect{padding:8px 26px 4px;font-size:13px;font-weight:800;color:#0A1E66;text-transform:uppercase;letter-spacing:.04em}
  #kr-report table{width:calc(100% - 52px);margin:0 26px 22px;border-collapse:collapse;font-size:14px}
  #kr-report th{text-align:left;background:#15327A;color:#fff;padding:8px 12px;font-size:12px;text-transform:uppercase}
  #kr-report td{padding:8px 12px;border-bottom:1px solid #eef1f6}
  #kr-report tr:nth-child(even) td{background:#F4F8FF}
  #kr-report .rk{color:#94a3b8;width:34px;text-align:center}
  #kr-report .kw{font-weight:600;color:#0A1E66}
  #kr-report .ht{text-align:center;color:#64748b;width:60px}
  #kr-report .barwrap{position:relative;display:flex;align-items:center;gap:8px}
  #kr-report .bar{height:18px;border-radius:5px;animation:kr-grow .8s ease both}
  #kr-report .barwrap span{font-weight:800;color:#0A1E66;font-size:13px}
  /* caption */
  #kr-cap{position:fixed;left:412px;bottom:42px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;
    background:rgba(10,18,40,.94);color:#fff;border:1px solid rgba(143,233,255,.32);border-radius:14px;
    padding:14px 22px;box-shadow:0 18px 46px rgba(0,0,0,.36);backdrop-filter:blur(8px);
    width:max-content;max-width:560px;text-align:left;animation:kr-pop .4s ease both;font-family:"Segoe UI",system-ui,Arial,sans-serif}
  #kr-cap .step{display:inline-block;background:#8FE9FF;color:#0A1E66;font-weight:800;font-size:13px;border-radius:6px;padding:1px 8px;margin-right:9px}
  #kr-cap .ttl{font-weight:700;font-size:18px}
  #kr-cap .det{display:block;margin-top:5px;color:#BFE0FF;font-size:14.5px;line-height:1.34}
  #kr-cap.center{left:50%;max-width:680px;text-align:center}
  #kr-ring{position:fixed;z-index:2147483640;pointer-events:none;border:3px solid #8FE9FF;border-radius:14px;
    box-shadow:0 0 0 4px rgba(143,233,255,.22),0 18px 48px rgba(0,0,0,.22);transition:all .25s ease}
`;

const injectStyle = (page) => page.addStyleTag({ content: BRAND_STYLE }).catch(() => {});

async function showStage(page, html) {
  await page.evaluate(({ inner, svg }) => {
    document.getElementById("kr-stage")?.remove();
    if (!document.getElementById("kr-hide-panel")) {
      const st = document.createElement("style");
      st.id = "kr-hide-panel";
      st.textContent = "#bluedev-keyword-radar-host{visibility:hidden!important}";
      document.documentElement.appendChild(st);
    }
    const stage = document.createElement("div");
    stage.id = "kr-stage";
    stage.innerHTML = inner.replace("__LOGO__", svg);
    document.documentElement.appendChild(stage);
  }, { inner: html, svg: iconSvg });
}
async function hideStage(page) {
  await page.evaluate(() => { const s = document.getElementById("kr-stage"); if (s) s.style.opacity = "0"; });
  await page.waitForTimeout(560);
  await page.evaluate(() => { document.getElementById("kr-stage")?.remove(); document.getElementById("kr-hide-panel")?.remove(); });
}

async function caption(page, step, title, detail, center) {
  await page.evaluate(({ s, t, d, c }) => {
    document.getElementById("kr-cap")?.remove();
    const cap = document.createElement("div");
    cap.id = "kr-cap";
    if (c) cap.className = "center";
    cap.innerHTML = (s ? '<span class="step">' + s + "</span>" : "") + '<span class="ttl">' + t + "</span>" + (d ? '<span class="det">' + d + "</span>" : "");
    document.documentElement.appendChild(cap);
  }, { s: step, t: title, d: detail, c: center });
}
const clearCaption = (page) => page.evaluate(() => { document.getElementById("kr-cap")?.remove(); document.getElementById("kr-ring")?.remove(); });

async function ring(page, sel) {
  await page.evaluate((s) => {
    document.getElementById("kr-ring")?.remove();
    const el = document.getElementById("bluedev-keyword-radar-host")?.shadowRoot?.querySelector(s);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const ring = document.createElement("div");
    ring.id = "kr-ring";
    ring.style.left = Math.max(4, r.left - 6) + "px";
    ring.style.top = Math.max(4, r.top - 6) + "px";
    ring.style.width = r.width + 12 + "px";
    ring.style.height = r.height + 12 + "px";
    document.documentElement.appendChild(ring);
  }, sel);
}

async function readData(page) {
  return page.evaluate(() => {
    const root = document.getElementById("bluedev-keyword-radar-host")?.shadowRoot;
    const rows = Array.from(root?.querySelectorAll(".table-wrap tbody tr") ?? []).slice(0, 10).map((tr) => {
      const td = tr.querySelectorAll("td");
      return {
        keyword: td[0]?.querySelector("strong")?.textContent?.trim() ?? "",
        hits: parseInt(td[1]?.textContent?.trim() ?? "1", 10) || 1,
        score: parseInt(td[2]?.textContent?.trim() ?? "0", 10) || 0
      };
    }).filter((r) => r.keyword);
    const m = root?.querySelectorAll(".summary-bar .metrics strong");
    return { rows, keywords: m?.[0]?.textContent ?? String(rows.length), hits: m?.[1]?.textContent ?? "", queries: m?.[2]?.textContent ?? "" };
  });
}

async function showReport(page, data) {
  const avg = data.rows.length ? Math.round(data.rows.reduce((s, r) => s + r.score, 0) / data.rows.length) : 0;
  const bar = (score) => {
    const color = score >= 75 ? "#16a34a" : score >= 55 ? "#f59e0b" : "#e11d48";
    return `<div class="barwrap"><div class="bar" style="width:${score}%;background:${color}"></div><span>${score}</span></div>`;
  };
  const rowsHtml = data.rows.slice(0, 8).map((r, i) => `<tr><td class="rk">${i + 1}</td><td class="kw">${r.keyword}</td><td class="ht">${r.hits}</td><td>${bar(r.score)}</td></tr>`).join("");
  await page.evaluate(({ html }) => {
    if (!document.getElementById("kr-hide-panel")) {
      const st = document.createElement("style");
      st.id = "kr-hide-panel";
      st.textContent = "#bluedev-keyword-radar-host{visibility:hidden!important}";
      document.documentElement.appendChild(st);
    }
    document.getElementById("kr-report")?.remove();
    const r = document.createElement("div");
    r.id = "kr-report";
    r.innerHTML = html;
    document.documentElement.appendChild(r);
  }, {
    html: `<div class="sheet">
      <div class="rhead">${iconSvg.replace("<svg", '<svg class="rlogo"')}<b>Keyword Radar — XLSX Raporu</b><span>Summary · Keywords · Analysis · Gap</span></div>
      <div class="cards">
        <div class="mc"><b>${data.keywords}</b><small>Kelime</small></div>
        <div class="mc"><b>${data.hits}</b><small>İsabet</small></div>
        <div class="mc"><b>${data.queries}</b><small>Sorgu</small></div>
        <div class="mc"><b>${avg}</b><small>Ort. skor</small></div>
      </div>
      <div class="sect">Top Fırsatlar — fırsat skoru (0–100)</div>
      <table><thead><tr><th>#</th><th>Kelime</th><th>İsabet</th><th>Fırsat skoru</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    </div>`
  });
}
const hideReport = (page) => page.evaluate(() => { document.getElementById("kr-report")?.remove(); document.getElementById("kr-hide-panel")?.remove(); });

const $ = (page, sel) => page.locator(sel);

async function main() {
  const ctx = await chromium.launchPersistentContext("", {
    headless: false,
    viewport: { width: 1280, height: 800 },
    args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`, "--no-first-run", "--no-default-browser-check"],
    acceptDownloads: true,
    recordVideo: { dir: rawDir, size: { width: 1280, height: 800 } }
  });
  let sw = ctx.serviceWorkers()[0];
  if (!sw) sw = await ctx.waitForEvent("serviceworker", { timeout: 15000 });
  await sw.evaluate(() => chrome.storage.local.set({ "bluedev-keyword-radar-locale": "tr", "bluedev-keyword-radar-collapsed": false }));

  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.route("**/*", (route) => {
    if (route.request().url().startsWith("chrome-extension://")) return route.continue(); // extension's own xlsx.js / fonts
    if (route.request().resourceType() === "document") return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: stubHtml() });
    return route.abort();
  });
  await page.goto("https://www.trendyol.com/sr?q=kulaklik", { waitUntil: "domcontentloaded" });
  await injectStyle(page);

  // ---- INTRO ----
  await showStage(page, `
    <div class="logo">__LOGO__</div>
    <div class="title">Keyword <span class="accent">Radar</span></div>
    <div class="tag">Türk pazaryeri alıcıları gerçekte ne yazıyor? Tahmin etme — topla, skorla, dışa aktar.</div>
    <div class="chips"><span class="chip"><span class="dot"></span>Amazon.com.tr · Trendyol · Hepsiburada · n11</span></div>
    <div class="brand">Bluedev · bluedev.dev</div>`);
  await page.waitForTimeout(3600);
  await hideStage(page);

  // ---- WALKTHROUGH ----
  await page.waitForSelector(".seed-field input", { timeout: 20000 });
  await page.waitForTimeout(300);
  await caption(page, "", "Panel pazaryeri sayfasında açılır", "Amazon.com.tr · Trendyol · Hepsiburada · n11 — sayfadan çıkmadan araştır.");
  await ring(page, ".radar-panel");
  await page.waitForTimeout(2400);

  await caption(page, "1", "Tek tohum kelime yaz", "Eklenti onu onlarca probe'a genişletir: sonek A–Z, önek A–Z, 0–9.");
  await ring(page, ".seed-field input");
  await $(page, ".seed-field input").click();
  await $(page, ".seed-field input").pressSequentially("kulaklık", { delay: 105 });
  await page.waitForTimeout(1200);

  const cbs = $(page, ".mode-grid input[type=checkbox]");
  for (const i of [0, 1]) { const cb = cbs.nth(i); if (!(await cb.isChecked())) await cb.check().catch(() => {}); }
  await page.evaluate(() => {
    const root = document.getElementById("bluedev-keyword-radar-host")?.shadowRoot;
    const opt = Array.from(root?.querySelectorAll(".speed-grid .speed-option") ?? []).find((o) => /Hızlı|Fast/.test(o.textContent || ""));
    const radio = opt?.querySelector("input[type=radio]");
    if (radio && !radio.checked) radio.click();
  });

  await caption(page, "2", "“Topla”ya bas", "Sayfanın GÖRÜNÜR otomatik tamamlama önerileri okunur — gizli veri kazıma yok.");
  await ring(page, ".actions button");
  await $(page, ".actions button").first().click();
  await page.waitForSelector(".table-wrap tbody tr", { timeout: 40000 });
  await caption(page, "", "Canlı toplama + skorlama", "Fırsat skoru = frekans + uzun-kuyruk + pazaryeri kapsamı + güven → tek 0–100.");
  await ring(page, ".summary-bar");
  await page.waitForTimeout(4600);

  await clearCaption(page);
  await caption(page, "3", "Skora göre sıralı sonuçlar", "Yüksek skorlu kelimeler = listelemende önce kullanman gerekenler.");
  await ring(page, ".table-wrap");
  await page.waitForTimeout(2800);

  await caption(page, "4", "Kelimeler — frekans", "En sık geçen tekil kelimeler: başlık ve etiket çekirdeğin.");
  await $(page, ".analysis-tabs button").nth(0).click();
  await ring(page, ".analysis-list");
  await page.waitForTimeout(2600);

  await caption(page, "5", "Kapsam", "Hangi kelime hangi pazaryerinde görünüyor — çok pazaryerli talep.");
  await $(page, ".analysis-tabs button").nth(1).click();
  await page.waitForTimeout(2600);

  await caption(page, "6", "Aksiyonlar — satış ipuçları", "Toplanan veriden otomatik: başlık önceliği, uzun-kuyruk hedefler, talep sinyalleri.");
  await $(page, ".analysis-tabs button").nth(2).click();
  await page.waitForTimeout(3000);

  await caption(page, "7", "Listing Gap", "Başlık + açıklamanı yapıştır → metninde eksik yüksek-değerli kelimeleri bulur.");
  await $(page, ".analysis-tabs button").nth(3).click();
  await ring(page, ".listing-gap-form");
  await page.waitForTimeout(800);
  await $(page, ".listing-gap-form input").fill("Kablosuz Bluetooth Kulaklık - Mikrofonlu");
  await $(page, ".listing-gap-form textarea").fill("Şarjlı, gürültü engelleyici kablosuz kulaklık. Telefon ve tablet uyumlu.");
  await page.waitForTimeout(700);
  await $(page, ".listing-gap-form button").click();
  await page.waitForTimeout(2800);

  await caption(page, "8", "Dışa aktar — CSV / XLSX", "Tek tıkla. XLSX = özet + kelimeler + analiz + gap, hepsi tek dosyada.");
  await ring(page, ".toolbar");
  const data = await readData(page);
  await $(page, '[aria-label*="XLSX"], .toolbar button:nth-child(3)').first().click().catch(() => {});
  await page.waitForTimeout(1500);

  // ---- XLSX REPORT SCENE (analyse the output) ----
  await clearCaption(page);
  await showReport(page, data);
  await page.waitForTimeout(700);
  await caption(page, "", "World-class XLSX raporu", "Markalı özet: metrik kartları + Top Fırsatlar bar grafiği.", true);
  await page.waitForTimeout(3800);
  await caption(page, "", "Skor ısı-haritası ile analiz", "🟢 yüksek → 🔴 düşük: hangi kelimeye öncelik vereceğini tek bakışta gör. Ekiple paylaş.", true);
  await page.waitForTimeout(4000);
  await clearCaption(page);
  await hideReport(page);

  // ---- OUTRO ----
  await showStage(page, `
    <div class="logo">__LOGO__</div>
    <div class="title">Keyword <span class="accent">Radar</span></div>
    <div class="tag">Gerçek alıcı talebine göre listeleme yaz.</div>
    <div class="chips">
      <span class="chip"><span class="dot"></span>Ücretsiz · Chrome Web Store</span>
      <span class="chip"><span class="dot"></span>Gizlilik önce · yalnızca yerel</span>
    </div>
    <div class="brand">bluedev.dev</div>`);
  await page.waitForTimeout(4000);

  const video = page.video();
  await page.close();
  const webm = resolve(rawDir, "keyword-radar-demo.webm");
  if (video) await video.saveAs(webm);
  await ctx.close();

  const mp4 = resolve(outDir, "keyword-radar-demo.mp4");
  execFileSync("ffmpeg", ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", "30", "-an", mp4], { stdio: "inherit" });
  console.log("MP4:", mp4);
}

await main();
