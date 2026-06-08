import { chromium, test, type BrowserContext } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const workspaceRoot = process.env.QA_WORKSPACE_ROOT ?? process.cwd();
const extensionSourcePath = path.join(workspaceRoot, "apps", "extension", "dist");
const extensionPath = process.env.QA_EXTENSION_PATH ?? (process.platform === "win32" ? "C:\\tmp\\keyword-radar-extension-demo" : path.join(workspaceRoot, ".tmp-extension-demo"));
const resultDir = path.join(workspaceRoot, "tests", "e2e", "results");
const productVideoDir = path.join(resultDir, "product-video");
const productVideoPath = path.join(productVideoDir, "keyword-radar-product-demo.webm");
const manifestPath = path.join(productVideoDir, "keyword-radar-product-demo.json");
const xlsxExportPath = path.join(productVideoDir, "keyword-radar-demo-export.xlsx");
const xlsxPreviewScreenshotPath = path.join(productVideoDir, "keyword-radar-xlsx-export-preview.png");

type DemoTarget =
  | { kind: "panel"; selector: string }
  | { kind: "page"; selector: string }
  | { kind: "point"; x: number; y: number; width?: number; height?: number };

type DemoExportRow = {
  keyword: string;
  detail: string;
  hits: string;
  score: string;
};

test.setTimeout(5 * 60 * 1000);

test("record a reusable Keyword Radar product demo video", async ({}, testInfo) => {
  await fs.mkdir(productVideoDir, { recursive: true });
  const rawVideoDir = testInfo.outputPath("raw-videos");
  await fs.mkdir(rawVideoDir, { recursive: true });
  await fs.access(extensionSourcePath);
  if (!process.env.QA_EXTENSION_PATH) {
    await fs.rm(extensionPath, { recursive: true, force: true });
    await fs.cp(extensionSourcePath, extensionPath, { recursive: true });
  }

  const launchOptions: Parameters<typeof chromium.launchPersistentContext>[1] = {
    headless: false,
    ignoreDefaultArgs: ["--disable-extensions"],
    locale: "tr-TR",
    viewport: { width: 1440, height: 1000 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--disable-search-engine-choice-screen",
      "--lang=tr-TR"
    ],
    acceptDownloads: true,
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1440, height: 1000 }
    }
  };
  if (process.env.QA_CHROME_PATH) {
    launchOptions.executablePath = process.env.QA_CHROME_PATH;
  }

  const context = await chromium.launchPersistentContext(testInfo.outputPath("chrome-profile"), launchOptions);
  const page = await context.newPage();
  const video = page.video();

  try {
    await showProductIntro(page);
    await openTrendyolFromGoogle(page);
    await dismissCookieBanners(page);
    await dismissTrendyolOverlays(page);
    await page.waitForSelector("#bluedev-keyword-radar-host", { state: "attached", timeout: 35_000 });
    await waitForPanelContent(page);
    await dismissCookieBanners(page);
    await dismissTrendyolOverlays(page);
    await page.waitForTimeout(500);
    await dismissCookieBanners(page);
    await dismissTrendyolOverlays(page);

    await showTargetCallout(
      page,
      { kind: "panel", selector: ".radar-panel" },
      "1. Radar paneli desteklenen pazaryerinde açılır",
      "Trendyol ana sayfasına gelince Keyword Radar sağ tarafta görünür; panel extension ikonundan açılıp kapatılabilir."
    );
    await page.waitForTimeout(2600);

    await closeRadarPanel(page);
    await showCaption(page, "Extension ikonuyla tekrar açın", "Chrome toolbar'daki Keyword Radar ikonuna tıkladığınızda panel aynı sayfada yeniden görünür.");
    await page.waitForTimeout(1600);
    await togglePanelThroughExtensionAction(context);
    await waitForPanelContent(page);
    await dismissCookieBanners(page);
    await dismissTrendyolOverlays(page);
    await showTargetCallout(
      page,
      { kind: "panel", selector: ".radar-panel" },
      "Panel yeniden açıldı",
      "Aynı floating panel ürün araştırmasına kaldığınız yerden devam eder."
    );
    await page.waitForTimeout(2200);

    await configurePanelForDemo(page, "telefon kilifi");
    await showTargetCallout(
      page,
      { kind: "panel", selector: "input[aria-label='Seed keyword']" },
      "2. Seed keyword girin",
      "Aramayı Radar panelindeki seed alanından başlatın. Uygulama marketplace autocomplete verisini bu kelime üzerinden toplar."
    );
    await page.waitForTimeout(1800);

    await showTargetCallout(
      page,
      { kind: "panel", selector: ".speed-grid" },
      "3. Tarama modunu seçin",
      "Fast: hızlı ilk tarama ve demo akışı.\nBalanced: hız ve güven dengesi.\nReliable: daha yavaş, geç gelen autocomplete sonuçları için daha istikrarlı."
    );
    await page.waitForTimeout(3000);
    await selectCollectionSpeed(page, "Fast");
    await showTargetCallout(page, { kind: "panel", selector: ".speed-grid" }, "Fast mod ile devam edin", "Ürün videosunda sonucu hızlı göstermek için Fast mod seçilir.");
    await page.waitForTimeout(1400);

    await showTargetCallout(
      page,
      { kind: "panel", selector: ".actions button" },
      "4. Collect ile fırsatları toplayın",
      "Collect, Radar panelindeki seed kelime üzerinden autocomplete önerilerini toplar ve fırsat skorlarını hesaplar."
    );
    await startCollection(page);
    await waitForCollection(page);
    await page.waitForTimeout(1800);

    await showTargetCallout(
      page,
      { kind: "panel", selector: "tbody" },
      "5. Skorları ve önerileri inceleyin",
      "Hits ve opportunity score hangi kelimelerin satış sayfasında öncelikli kullanılacağını gösterir."
    );
    await page.waitForTimeout(2600);

    await openActionsTab(page);
    await showTargetCallout(
      page,
      { kind: "panel", selector: ".analysis-panel" },
      "6. Satış aksiyonlarına çevirin",
      "Actions sekmesi başlık lideri, long-tail hedefler, search terms ve AI fit önerisi üretir."
    );
    await page.waitForTimeout(3600);

    await openWordsTab(page);
    await clickToolbarButton(page, "Copy results", "7. Copy ile hızlıca kullanın", "Sonuçları ürün açıklaması, brief veya çalışma dokümanına tek tıkla taşıyın.");
    await page.waitForTimeout(1700);

    await downloadToolbarExport(page, "Export XLSX", xlsxExportPath, "8. XLSX olarak raporlayın", "XLSX çıktısı scoring ve coverage metrikleriyle daha zengin analiz için kullanılır.");
    const exportRows = await readPanelRows(page);
    await showXlsxExportPreview(page, exportRows, xlsxExportPath, xlsxPreviewScreenshotPath);
    await page.waitForTimeout(4200);

  } finally {
    await page.close();
    if (video) {
      await video.saveAs(productVideoPath);
    }
    await context.close();
  }

  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "Detailed Playwright product demo",
        flow: "Product intro -> Google search -> Trendyol homepage -> Keyword Radar seed input -> Fast collect -> XLSX export preview",
        url: "https://www.trendyol.com/",
        seed: "telefon kilifi",
        video: productVideoPath,
        mp4: path.join(productVideoDir, "keyword-radar-product-demo.mp4"),
        exports: {
          xlsx: xlsxExportPath
        },
        screenshots: {
          xlsxPreview: xlsxPreviewScreenshotPath
        }
      },
      null,
      2
    )
  );
});

async function showProductIntro(page: import("@playwright/test").Page): Promise<void> {
  await page.setContent(
    `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Keyword Radar Demo</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f6f8fb;
        color: #111827;
        font-family: Inter, Arial, sans-serif;
      }
      main {
        width: min(1120px, calc(100vw - 96px));
        display: grid;
        gap: 28px;
      }
      .eyebrow {
        margin: 0 0 12px;
        color: #0f766e;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      h1 {
        max-width: 860px;
        margin: 0;
        font-size: 58px;
        line-height: 1.04;
        letter-spacing: 0;
      }
      .lead {
        max-width: 820px;
        margin: 0;
        color: #475569;
        font-size: 22px;
        line-height: 1.45;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      article {
        min-height: 170px;
        padding: 22px;
        border: 1px solid #d8e2ef;
        background: #ffffff;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
      }
      article strong {
        display: block;
        margin-bottom: 10px;
        font-size: 19px;
      }
      article p {
        margin: 0;
        color: #475569;
        font-size: 16px;
        line-height: 1.48;
      }
      .flow {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        color: #334155;
        font-weight: 700;
      }
      .flow span {
        padding: 14px 16px;
        border: 1px solid #cbd5e1;
        background: #eaf7f5;
      }
    </style>
  </head>
  <body>
    <main>
      <section>
        <p class="eyebrow">Marketplace Keyword Radar</p>
        <h1>Pazar yeri arama talebini ürün listeleme kararına çevirir.</h1>
        <p class="lead">Seed keyword girersiniz; Radar gerçek autocomplete önerilerini toplar, fırsat skorlar ve satışa dönük aksiyonları tek panelde hazırlar.</p>
      </section>
      <section class="grid" aria-label="Ürün tanıtımı">
        <article>
          <strong>Ne işe yarar?</strong>
          <p>Trendyol gibi desteklenen pazaryerlerinde müşterinin yazdığı arama varyasyonlarını yakalar.</p>
        </article>
        <article>
          <strong>Neden kullanılır?</strong>
          <p>Başlık, açıklama ve search terms kararlarını tahminle değil gerçek arama sinyaliyle iyileştirir.</p>
        </article>
        <article>
          <strong>Çıktı ne sağlar?</strong>
          <p>Keyword listesi, hit sayısı, opportunity score, aksiyon önerisi ve XLSX raporu üretir.</p>
        </article>
      </section>
      <section class="flow" aria-label="Kullanım akışı">
        <span>1. Seed keyword</span>
        <span>2. Tarama modu</span>
        <span>3. Collect</span>
        <span>4. XLSX export</span>
      </section>
    </main>
  </body>
</html>`,
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(5200);
}

async function openTrendyolFromGoogle(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("https://www.google.com/?hl=tr", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await dismissCookieBanners(page);
  await dismissGooglePromos(page);
  await showCaption(page, "Başlangıç: Google üzerinden giriş", "Kullanıcı önce Google'da Trendyol'u bulur ve pazaryerine normal akışla girer.");
  await page.waitForTimeout(1200);

  const searchInput = page.locator("textarea[name='q'], input[name='q']").first();
  await showTargetCallout(page, { kind: "page", selector: "textarea[name='q'], input[name='q']" }, "Google'da Trendyol'u arayın", "Kullanıcı ürüne gerçek bir başlangıç akışıyla ulaşır; demo pazaryerine doğrudan zıplamaz.");
  await searchInput.click({ timeout: 15_000 });
  await searchInput.fill("Trendyol");
  await dismissGooglePromos(page);
  await page.waitForTimeout(1300);

  await showCaption(page, "Trendyol ana sayfasına geçin", "Google araması başlangıç adımı gösterildi. Şimdi resmi Trendyol ana sayfası açılır ve extension paneli burada görünür.");
  await page.waitForTimeout(1300);
  await page.goto("https://www.trendyol.com/", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("domcontentloaded");
}

async function dismissTrendyolOverlays(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const globalWindow = window as Window & { __keywordRadarDemoModalGuardInstalled?: boolean };
    const modalTextPattern = /Aradığın her şey Trendyol'da|Sana özel öneriler/i;

    function removePreferenceModal(): void {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>("div, section, aside, [role='dialog']"))
        .filter((element) => modalTextPattern.test(element.innerText ?? "") && /Kadın|Erkek/i.test(element.innerText ?? ""))
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 280 && rect.height > 220)
        .filter(({ rect }) => rect.width < window.innerWidth * 0.78 && rect.height < window.innerHeight * 0.78)
        .sort((left, right) => right.rect.width * right.rect.height - left.rect.width * left.rect.height);

      candidates[0]?.element.remove();

      for (const element of Array.from(document.querySelectorAll<HTMLElement>("div, section, aside, [role='dialog']"))) {
        const id = element.id ?? "";
        if (id === "bluedev-keyword-radar-host" || id.startsWith("keyword-radar-demo")) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const zIndex = Number.parseInt(style.zIndex || "0", 10);
        const centeredDialog =
          rect.width > 280 &&
          rect.width < 760 &&
          rect.height > 80 &&
          rect.height < 760 &&
          Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2) < window.innerWidth * 0.22 &&
          Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2) < window.innerHeight * 0.28;
        const looksBlank = (element.innerText ?? "").trim().length === 0;
        if ((style.position === "fixed" || style.position === "absolute") && centeredDialog && looksBlank && zIndex > 10) {
          element.remove();
        }
      }

      for (const element of Array.from(document.body.children) as HTMLElement[]) {
        const id = element.id ?? "";
        if (id === "bluedev-keyword-radar-host" || id.startsWith("keyword-radar-demo")) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const zIndex = Number.parseInt(style.zIndex || "0", 10);
        const coversViewport = rect.width > window.innerWidth * 0.72 && rect.height > window.innerHeight * 0.72;
        if ((style.position === "fixed" || style.position === "absolute") && coversViewport && zIndex > 10) {
          element.remove();
        }
      }

      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }

    removePreferenceModal();

    if (!globalWindow.__keywordRadarDemoModalGuardInstalled) {
      new MutationObserver(removePreferenceModal).observe(document.body, { childList: true, subtree: true });
      globalWindow.__keywordRadarDemoModalGuardInstalled = true;
    }
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const preferenceModalVisible = await page
      .getByText(/Aradığın her şey Trendyol'da|Sana özel öneriler/i)
      .isVisible({ timeout: 900 })
      .catch(() => false);

    if (!preferenceModalVisible) {
      break;
    }

    const selectors = [
      page.getByRole("button", { name: /^Erkek$/ }),
      page.getByRole("button", { name: /^Kadın$/ }),
      page.getByText(/^Erkek$/).last(),
      page.getByText(/^Kadın$/).last(),
      page.locator("button:has-text('Erkek')"),
      page.locator("button:has-text('Kadın')")
    ];

    for (const selector of selectors) {
      const clicked = await selector.first().click({ timeout: 800 }).then(() => true).catch(() => false);
      if (clicked) {
        break;
      }
    }

    await page.mouse.click(944, 320).catch(() => undefined);
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForTimeout(500);
  }
}

async function configurePanelForDemo(page: import("@playwright/test").Page, seed: string): Promise<void> {
  const seedInput = page.locator("#bluedev-keyword-radar-host input[aria-label='Seed keyword']");
  await seedInput.click({ timeout: 10_000 });
  await seedInput.press("Control+A");
  await seedInput.type(seed, { delay: 35 });

  await page.locator("#bluedev-keyword-radar-host").evaluate((host, value) => {
    const root = host.shadowRoot;
    if (!root) {
      throw new Error("Keyword Radar shadow root was not found.");
    }

    const seedInput = root.querySelector<HTMLInputElement>("input[aria-label='Seed keyword']");
    if (!seedInput) {
      throw new Error("Seed input was not found.");
    }
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    valueSetter?.call(seedInput, value);
    seedInput.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    seedInput.dispatchEvent(new Event("change", { bubbles: true }));

    for (const label of Array.from(root.querySelectorAll<HTMLLabelElement>(".mode-grid .check"))) {
      const checkbox = label.querySelector<HTMLInputElement>("input[type='checkbox']");
      const shouldBeChecked = label.textContent?.includes("Seed") ?? false;
      if (checkbox && checkbox.checked !== shouldBeChecked) {
        checkbox.click();
      }
    }

  }, seed);

  await page.waitForFunction(
    (value) => {
      const root = document.querySelector("#bluedev-keyword-radar-host")?.shadowRoot;
      const seedInput = root?.querySelector<HTMLInputElement>("input[aria-label='Seed keyword']");
      const collectButton = Array.from(root?.querySelectorAll<HTMLButtonElement>(".actions button") ?? []).find((button) => button.textContent?.trim() === "Collect");
      return seedInput?.value === value && collectButton && !collectButton.disabled;
    },
    seed,
    { timeout: 10_000 }
  );
}

async function selectCollectionSpeed(page: import("@playwright/test").Page, speedLabel: "Fast" | "Balanced" | "Reliable"): Promise<void> {
  await page.locator("#bluedev-keyword-radar-host").evaluate((host, label) => {
    const root = host.shadowRoot;
    const speedOption = Array.from(root?.querySelectorAll<HTMLLabelElement>(".speed-grid .speed-option") ?? []).find((option) => option.textContent?.includes(label));
    const speedInput = speedOption?.querySelector<HTMLInputElement>("input[type='radio']");
    if (!speedInput) {
      throw new Error(`${label} speed option was not found.`);
    }
    if (!speedInput.checked) {
      speedInput.click();
    }
  }, speedLabel);

  await page.waitForFunction(
    (label) => {
      const root = document.querySelector("#bluedev-keyword-radar-host")?.shadowRoot;
      const speedOption = Array.from(root?.querySelectorAll<HTMLLabelElement>(".speed-grid .speed-option") ?? []).find((option) => option.textContent?.includes(label));
      return Boolean(speedOption?.querySelector<HTMLInputElement>("input[type='radio']")?.checked);
    },
    speedLabel,
    { timeout: 5_000 }
  );
}

async function waitForPanelContent(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const root = document.querySelector("#bluedev-keyword-radar-host")?.shadowRoot;
      return Boolean(root?.querySelector(".radar-panel"));
    },
    undefined,
    { timeout: 20_000 }
  );
}

async function closeRadarPanel(page: import("@playwright/test").Page): Promise<void> {
  await showTargetCallout(page, { kind: "panel", selector: "button[title='Close']" }, "Paneli kapatın", "Bu adım extension'ın paneli aç/kapat davranışını gösterir.");
  await page.locator("#bluedev-keyword-radar-host button[title='Close']").click({ timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const root = document.querySelector("#bluedev-keyword-radar-host")?.shadowRoot;
      return !root?.querySelector(".radar-panel");
    },
    undefined,
    { timeout: 10_000 }
  );
}

async function togglePanelThroughExtensionAction(context: BrowserContext): Promise<void> {
  const serviceWorker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker", { timeout: 10_000 });
  await serviceWorker.evaluate(async () => {
    const chromeApi = (globalThis as typeof globalThis & { chrome: typeof chrome }).chrome;
    const tabs = await chromeApi.tabs.query({ active: true, currentWindow: true });
    const activeTabId = tabs[0]?.id;
    if (!activeTabId) {
      throw new Error("Active tab was not found.");
    }
    await chromeApi.tabs.sendMessage(activeTabId, { type: "KEYWORD_RADAR_TOGGLE_PANEL" });
  });
}

async function startCollection(page: import("@playwright/test").Page): Promise<void> {
  await page.locator("#bluedev-keyword-radar-host").evaluate((host) => {
    const root = host.shadowRoot;
    const collectButton = Array.from(root?.querySelectorAll<HTMLButtonElement>(".actions button") ?? []).find((button) => button.textContent?.trim() === "Collect");
    if (!collectButton) {
      throw new Error("Collect button was not found.");
    }
    collectButton.click();
  });
}

async function waitForCollection(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const root = document.querySelector("#bluedev-keyword-radar-host")?.shadowRoot;
      if (!root) {
        return false;
      }
      const status = root.querySelector(".status")?.textContent?.trim();
      const rows = root.querySelectorAll("tbody tr").length;
      const error = root.querySelector(".error")?.textContent?.trim();
      return (status === "Collected" && rows > 0) || status === "Error" || Boolean(error);
    },
    undefined,
    { timeout: 75_000 }
  );
}

async function openActionsTab(page: import("@playwright/test").Page): Promise<void> {
  await page.locator("#bluedev-keyword-radar-host").evaluate((host) => {
    const root = host.shadowRoot;
    const actionsTab = Array.from(root?.querySelectorAll<HTMLButtonElement>(".analysis-tabs button") ?? []).find((button) => button.textContent?.trim() === "Actions");
    actionsTab?.click();
  });
  await page.waitForTimeout(300);
}

async function openWordsTab(page: import("@playwright/test").Page): Promise<void> {
  await page.locator("#bluedev-keyword-radar-host").evaluate((host) => {
    const root = host.shadowRoot;
    const wordsTab = Array.from(root?.querySelectorAll<HTMLButtonElement>(".analysis-tabs button") ?? []).find((button) => button.textContent?.trim() === "Words");
    wordsTab?.click();
  });
  await page.waitForTimeout(300);
}

async function clickToolbarButton(page: import("@playwright/test").Page, title: string, calloutTitle: string, detail: string): Promise<void> {
  await showTargetCallout(page, { kind: "panel", selector: `button[title='${title}']` }, calloutTitle, detail);
  await page.locator(`#bluedev-keyword-radar-host button[title='${title}']`).click({ timeout: 10_000 });
  await waitForActionNotice(page);
}

async function downloadToolbarExport(page: import("@playwright/test").Page, title: string, savePath: string, calloutTitle: string, detail: string): Promise<void> {
  await showTargetCallout(page, { kind: "panel", selector: `button[title='${title}']` }, calloutTitle, detail);
  const downloadPromise = page.waitForEvent("download", { timeout: 20_000 });
  await page.locator(`#bluedev-keyword-radar-host button[title='${title}']`).click({ timeout: 10_000 });
  const download = await downloadPromise;
  await download.saveAs(savePath);
  await waitForActionNotice(page);
}

async function readPanelRows(page: import("@playwright/test").Page): Promise<DemoExportRow[]> {
  return page.locator("#bluedev-keyword-radar-host").evaluate((host) => {
    const root = host.shadowRoot;
    return Array.from(root?.querySelectorAll("tbody tr") ?? [])
      .slice(0, 10)
      .map((row) => {
        const cells = row.querySelectorAll("td");
        return {
          keyword: cells[0]?.querySelector("strong")?.textContent?.trim() ?? "",
          detail: cells[0]?.querySelector("small")?.textContent?.trim() ?? "",
          hits: cells[1]?.textContent?.trim() ?? "",
          score: cells[2]?.textContent?.trim() ?? ""
        };
      })
      .filter((row) => row.keyword.length > 0);
  });
}

async function showXlsxExportPreview(page: import("@playwright/test").Page, rows: DemoExportRow[], xlsxPathValue: string, screenshotPath: string): Promise<void> {
  await fs.access(xlsxPathValue);
  const fileName = path.basename(xlsxPathValue);
  const rowsHtml = rows
    .map(
      (row, index) => `<tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(row.keyword)}</strong><small>${escapeHtml(row.detail)}</small></td>
        <td>${escapeHtml(row.hits)}</td>
        <td>${escapeHtml(row.score)}</td>
      </tr>`
    )
    .join("");

  await page.setContent(
    `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>XLSX Export Preview</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #eef4f8;
        color: #111827;
        font-family: Inter, Arial, sans-serif;
      }
      main {
        width: min(1120px, calc(100vw - 96px));
        display: grid;
        gap: 18px;
      }
      header {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 24px;
      }
      .eyebrow {
        margin: 0 0 6px;
        color: #0f766e;
        font-weight: 800;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: 42px;
        line-height: 1.08;
        letter-spacing: 0;
      }
      .file {
        padding: 12px 14px;
        border: 1px solid #b6c7d8;
        background: #ffffff;
        color: #334155;
        font-weight: 700;
      }
      .sheet {
        border: 1px solid #c6d3e1;
        background: #ffffff;
        box-shadow: 0 22px 48px rgba(15, 23, 42, 0.14);
        overflow: hidden;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 16px;
      }
      th, td {
        padding: 14px 16px;
        border-right: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #0f766e;
        color: #ffffff;
        font-size: 14px;
        text-transform: uppercase;
      }
      td:first-child, th:first-child {
        width: 64px;
        text-align: right;
        color: #64748b;
      }
      td:nth-child(3), td:nth-child(4), th:nth-child(3), th:nth-child(4) {
        width: 120px;
        text-align: right;
      }
      td strong {
        display: block;
        margin-bottom: 4px;
      }
      td small {
        display: block;
        color: #64748b;
      }
      .note {
        margin: 0;
        color: #475569;
        font-size: 18px;
        line-height: 1.4;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <p class="eyebrow">XLSX export sonucu</p>
          <h1>Fast mod taraması rapora dönüştürüldü.</h1>
        </div>
        <div class="file">${escapeHtml(fileName)}</div>
      </header>
      <section class="sheet" aria-label="XLSX export preview">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Keyword</th>
              <th>Hits</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </section>
      <p class="note">Bu ekran görüntüsü XLSX export içeriğinin ürün araştırması, ekip raporu veya listeleme optimizasyon brief'i için nasıl okunacağını gösterir.</p>
    </main>
  </body>
</html>`,
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: screenshotPath, fullPage: true });
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

async function waitForActionNotice(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const root = document.querySelector("#bluedev-keyword-radar-host")?.shadowRoot;
      return Boolean(root?.querySelector(".action-notice")?.textContent?.trim());
    },
    undefined,
    { timeout: 6_000 }
  ).catch(() => undefined);
}

async function showCaption(page: import("@playwright/test").Page, title: string, detail: string): Promise<void> {
  await page.evaluate(({ captionTitle, captionDetail }) => {
    function prepareDemoOverlayStack(): void {
      const host = document.querySelector<HTMLElement>("#bluedev-keyword-radar-host");
      host?.style.setProperty("z-index", "2147483000", "important");
      const root = host?.shadowRoot;
      if (root && !root.getElementById("keyword-radar-demo-panel-stack")) {
        const style = document.createElement("style");
        style.id = "keyword-radar-demo-panel-stack";
        style.textContent = ".radar-panel{z-index:2147483000!important}";
        root.append(style);
      }
    }

    prepareDemoOverlayStack();
    for (const id of ["keyword-radar-demo-caption", "keyword-radar-demo-callout", "keyword-radar-demo-arrow", "keyword-radar-demo-highlight"]) {
      document.getElementById(id)?.remove();
    }
    let caption = document.getElementById("keyword-radar-demo-caption");
    if (!caption) {
      caption = document.createElement("div");
      caption.id = "keyword-radar-demo-caption";
      caption.setAttribute("aria-hidden", "true");
      caption.style.position = "fixed";
      caption.style.left = "50%";
      caption.style.top = "50%";
      caption.style.transform = "translate(-50%, -50%)";
      caption.style.zIndex = "2147483602";
      caption.style.width = "min(640px, calc(100vw - 56px))";
      caption.style.padding = "22px 26px 24px";
      caption.style.border = "1px solid rgba(255,255,255,0.22)";
      caption.style.background = "rgba(10, 20, 32, 0.9)";
      caption.style.color = "#ffffff";
      caption.style.font = "500 17px/1.45 Inter, Arial, sans-serif";
      caption.style.boxShadow = "0 20px 48px rgba(0,0,0,0.28)";
      caption.style.backdropFilter = "blur(8px)";
      caption.style.textAlign = "center";
      document.body.append(caption);
    }
    caption.innerHTML = "";
    const heading = document.createElement("strong");
    heading.textContent = captionTitle;
    heading.style.display = "block";
    heading.style.fontSize = "28px";
    heading.style.lineHeight = "1.24";
    heading.style.marginBottom = "10px";
    const body = document.createElement("span");
    body.textContent = captionDetail;
    body.style.display = "block";
    body.style.color = "rgba(255,255,255,0.9)";
    body.style.whiteSpace = "pre-line";
    caption.append(heading, body);
  }, { captionTitle: title, captionDetail: detail });
}

async function showTargetCallout(page: import("@playwright/test").Page, target: DemoTarget, title: string, detail: string): Promise<void> {
  await page.evaluate(({ demoTarget, calloutTitle, calloutDetail }) => {
    function prepareDemoOverlayStack(): void {
      const host = document.querySelector<HTMLElement>("#bluedev-keyword-radar-host");
      host?.style.setProperty("z-index", "2147483000", "important");
      const root = host?.shadowRoot;
      if (root && !root.getElementById("keyword-radar-demo-panel-stack")) {
        const style = document.createElement("style");
        style.id = "keyword-radar-demo-panel-stack";
        style.textContent = ".radar-panel{z-index:2147483000!important}";
        root.append(style);
      }
    }

    function clearDemoOverlays(): void {
      for (const id of ["keyword-radar-demo-caption", "keyword-radar-demo-callout", "keyword-radar-demo-arrow", "keyword-radar-demo-highlight"]) {
        document.getElementById(id)?.remove();
      }
    }

    function resolveDemoTargetRect(targetValue: DemoTarget): DOMRect | null {
      if (targetValue.kind === "point") {
        return new DOMRect(targetValue.x, targetValue.y, targetValue.width ?? 1, targetValue.height ?? 1);
      }

      const element =
        targetValue.kind === "panel"
          ? document.querySelector("#bluedev-keyword-radar-host")?.shadowRoot?.querySelector<HTMLElement>(targetValue.selector)
          : document.querySelector<HTMLElement>(targetValue.selector);

      return element?.getBoundingClientRect() ?? null;
    }

    function positionDemoCallout(calloutElement: HTMLElement, targetRect: DOMRect): DOMRect {
      const margin = 24;
      const preferredLeft = targetRect.left > window.innerWidth * 0.48;
      let left = preferredLeft ? targetRect.left - calloutElement.offsetWidth - margin : targetRect.right + margin;
      if (left + calloutElement.offsetWidth > window.innerWidth - margin) {
        left = targetRect.left - calloutElement.offsetWidth - margin;
      }
      if (left < margin) {
        left = Math.min(window.innerWidth - calloutElement.offsetWidth - margin, margin);
      }

      let top = targetRect.top + targetRect.height / 2 - calloutElement.offsetHeight / 2;
      if (top < margin) {
        top = margin;
      }
      if (top + calloutElement.offsetHeight > window.innerHeight - margin) {
        top = window.innerHeight - calloutElement.offsetHeight - margin;
      }

      calloutElement.style.left = `${Math.round(left)}px`;
      calloutElement.style.top = `${Math.round(top)}px`;
      return calloutElement.getBoundingClientRect();
    }

    function drawDemoArrow(calloutRect: DOMRect, targetRect: DOMRect): void {
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      const calloutIsLeft = calloutRect.right <= targetRect.left;
      const calloutIsRight = calloutRect.left >= targetRect.right;
      const startX = calloutIsRight ? calloutRect.left : calloutRect.right;
      const startY = calloutRect.top + calloutRect.height / 2;
      const targetX = calloutIsLeft ? targetRect.left : calloutIsRight ? targetRect.right : targetCenterX;
      const targetY = Math.min(Math.max(startY, targetRect.top + 10), targetRect.bottom - 10) || targetCenterY;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = "keyword-radar-demo-arrow";
      svg.setAttribute("aria-hidden", "true");
      svg.style.position = "fixed";
      svg.style.left = "0";
      svg.style.top = "0";
      svg.style.width = "100vw";
      svg.style.height = "100vh";
      svg.style.zIndex = "2147483647";
      svg.style.pointerEvents = "none";
      svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);

      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", "keyword-radar-demo-arrowhead");
      marker.setAttribute("markerWidth", "10");
      marker.setAttribute("markerHeight", "10");
      marker.setAttribute("refX", "8");
      marker.setAttribute("refY", "5");
      marker.setAttribute("orient", "auto");
      const markerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      markerPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
      markerPath.setAttribute("fill", "#14b8a6");
      marker.append(markerPath);
      defs.append(marker);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(startX));
      line.setAttribute("y1", String(startY));
      line.setAttribute("x2", String(targetX));
      line.setAttribute("y2", String(targetY));
      line.setAttribute("stroke", "#14b8a6");
      line.setAttribute("stroke-width", "4");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("marker-end", "url(#keyword-radar-demo-arrowhead)");
      svg.append(defs, line);
      document.body.append(svg);
    }

    prepareDemoOverlayStack();
    clearDemoOverlays();

    const rect = resolveDemoTargetRect(demoTarget);
    if (!rect || rect.width === 0 || rect.height === 0) {
      return;
    }

    const highlight = document.createElement("div");
    highlight.id = "keyword-radar-demo-highlight";
    highlight.setAttribute("aria-hidden", "true");
    highlight.style.position = "fixed";
    highlight.style.zIndex = "2147483601";
    highlight.style.pointerEvents = "none";
    highlight.style.border = "3px solid #14b8a6";
    highlight.style.boxShadow = "0 0 0 4px rgba(20, 184, 166, 0.24), 0 18px 48px rgba(0,0,0,0.24)";
    highlight.style.transition = "all 180ms ease";
    highlight.style.left = `${Math.max(8, rect.left - 6)}px`;
    highlight.style.top = `${Math.max(8, rect.top - 6)}px`;
    highlight.style.width = `${rect.width + 12}px`;
    highlight.style.height = `${rect.height + 12}px`;
    document.body.append(highlight);

    const callout = document.createElement("div");
    callout.id = "keyword-radar-demo-callout";
    callout.setAttribute("aria-hidden", "true");
    callout.style.position = "fixed";
    callout.style.zIndex = "2147483602";
    callout.style.width = "430px";
    callout.style.maxWidth = "calc(100vw - 48px)";
    callout.style.padding = "15px 17px 16px";
    callout.style.border = "1px solid rgba(255,255,255,0.24)";
    callout.style.background = "rgba(10, 20, 32, 0.92)";
    callout.style.color = "#fff";
    callout.style.font = "500 15px/1.42 Inter, Arial, sans-serif";
    callout.style.boxShadow = "0 18px 46px rgba(0,0,0,0.3)";
    callout.style.backdropFilter = "blur(8px)";
    callout.innerHTML = "";

    const heading = document.createElement("strong");
    heading.textContent = calloutTitle;
    heading.style.display = "block";
    heading.style.fontSize = "21px";
    heading.style.lineHeight = "1.23";
    heading.style.marginBottom = "7px";

    const body = document.createElement("span");
    body.textContent = calloutDetail;
    body.style.display = "block";
    body.style.color = "rgba(255,255,255,0.88)";
    body.style.whiteSpace = "pre-line";
    callout.append(heading, body);
    document.body.append(callout);

    const calloutRect = positionDemoCallout(callout, rect);
    drawDemoArrow(calloutRect, rect);
  }, { demoTarget: target, calloutTitle: title, calloutDetail: detail });
}

async function dismissCookieBanners(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const globalWindow = window as Window & { __keywordRadarDemoCookieGuardInstalled?: boolean };
    const cookiePattern = /Tanımlama bilgilerini|Tanımlama Bilgisi|Tüm Tanımlama Bilgilerini Kabul Et|Tümünü Reddet|Kabul Et|Accept/i;

    function removeCookieBanner(): void {
      for (const element of Array.from(document.querySelectorAll<HTMLElement>("div, section, aside, footer"))) {
        const id = element.id ?? "";
        if (id === "bluedev-keyword-radar-host" || id.startsWith("keyword-radar-demo")) {
          continue;
        }

        const text = element.innerText ?? "";
        if (!cookiePattern.test(text)) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const isBottomBanner = rect.width > window.innerWidth * 0.72 && rect.height > 48 && rect.bottom > window.innerHeight - 12;
        const isOverlay = style.position === "fixed" || style.position === "sticky" || Number.parseInt(style.zIndex || "0", 10) > 10;
        if (isBottomBanner && isOverlay) {
          element.remove();
        }
      }
    }

    removeCookieBanner();

    if (!globalWindow.__keywordRadarDemoCookieGuardInstalled) {
      new MutationObserver(removeCookieBanner).observe(document.body, { childList: true, subtree: true });
      globalWindow.__keywordRadarDemoCookieGuardInstalled = true;
    }
  });

  const buttons = [
    page.getByRole("button", { name: /Tüm Tanımlama Bilgilerini Kabul Et|Kabul Et|accept all|accept/i }),
    page.getByRole("button", { name: /Tümünü Reddet/i }),
    page.locator("button:has-text('Kabul Et')"),
    page.locator("button:has-text('Tüm Tanımlama Bilgilerini Kabul Et')"),
    page.locator("button:has-text('Tümünü Reddet')"),
    page.locator("button:has-text('Accept')")
  ];

  for (const button of buttons) {
    await button.first().click({ timeout: 1500 }).catch(() => undefined);
  }
}

async function dismissGooglePromos(page: import("@playwright/test").Page): Promise<void> {
  const buttons = [
    page.getByRole("button", { name: /Chrome'u kullanma|No thanks|Not now/i }),
    page.locator("button:has-text(\"Chrome'u kullanma\")"),
    page.locator("button:has-text('No thanks')")
  ];

  for (const button of buttons) {
    await button.first().click({ timeout: 1200 }).catch(() => undefined);
  }
}
