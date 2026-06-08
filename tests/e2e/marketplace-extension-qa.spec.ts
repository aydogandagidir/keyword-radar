import { chromium, expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

type QaCase = {
  id: string;
  marketplace: string;
  url: string;
  seed: string;
};

type QaResult = {
  id: string;
  marketplace: string;
  seed: string;
  url: string;
  finalUrl?: string;
  panelVisible: boolean;
  status?: string;
  keywordCount: number;
  hitCount: number;
  queryCount: number;
  rows: Array<{ keyword: string; detail: string; hits: string; score: string }>;
  actions: string[];
  csvDownload: "ok" | "skipped" | "failed";
  error?: string;
  screenshot?: string;
  video?: string;
};

const workspaceRoot = process.env.QA_WORKSPACE_ROOT ?? process.cwd();
const extensionSourcePath = path.join(workspaceRoot, "apps", "extension", "dist");
const resultDir = path.join(workspaceRoot, "tests", "e2e", "results");
const videoDir = path.join(resultDir, "videos");

const qaCases: QaCase[] = [
  {
    id: "amazon-tr-kulaklik",
    marketplace: "Amazon.com.tr",
    url: "https://www.amazon.com.tr/s?k=kulaklik",
    seed: "kulaklik"
  },
  {
    id: "trendyol-telefon-kilifi",
    marketplace: "Trendyol",
    url: "https://www.trendyol.com/sr?q=telefon%20kilifi",
    seed: "telefon kilifi"
  },
  {
    id: "n11-bebek-cantasi",
    marketplace: "n11",
    url: "https://www.n11.com/arama?q=bebek%20cantasi",
    seed: "bebek cantasi"
  }
];

test.setTimeout(8 * 60 * 1000);

test("Chrome extension marketplace QA matrix", async ({}, testInfo) => {
  await fs.mkdir(resultDir, { recursive: true });
  await fs.mkdir(videoDir, { recursive: true });
  const rawVideoDir = testInfo.outputPath("raw-videos");
  await fs.mkdir(rawVideoDir, { recursive: true });
  await fs.access(extensionSourcePath);
  const extensionPath = process.env.QA_EXTENSION_PATH ?? testInfo.outputPath("extension-dist");
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

  const results: QaResult[] = [];

  try {
    for (const qaCase of qaCases) {
      const page = await context.newPage();
      const video = page.video();
      const result: QaResult = {
        id: qaCase.id,
        marketplace: qaCase.marketplace,
        seed: qaCase.seed,
        url: qaCase.url,
        panelVisible: false,
        keywordCount: 0,
        hitCount: 0,
        queryCount: 0,
        rows: [],
        actions: [],
        csvDownload: "skipped"
      };

      try {
        await page.goto(qaCase.url, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await dismissCookiePrompts(page);
        await page.waitForSelector("#bluedev-keyword-radar-host", { state: "attached", timeout: 35_000 });
        await waitForPanelContent(page);
        result.panelVisible = true;

        await configurePanelForSmokeRun(page, qaCase.seed);
        await startCollection(page);
        try {
          await waitForCollection(page);
        } catch (error) {
          result.error = error instanceof Error ? error.message : String(error);
        }
        await openActionsTab(page).catch(() => undefined);

        let panelState = await readPanelState(page);
        if (panelState.status === "Ready" && (panelState.queryCount ?? 0) === 0 && (panelState.keywordCount ?? 0) === 0) {
          await configurePanelForSmokeRun(page, qaCase.seed);
          await startCollection(page);
          try {
            await waitForCollection(page);
            result.error = undefined;
          } catch (error) {
            result.error = error instanceof Error ? error.message : String(error);
          }
          await openActionsTab(page).catch(() => undefined);
          panelState = await readPanelState(page);
        }
        Object.assign(result, panelState);
        result.finalUrl = page.url();

        const screenshotPath = path.join(resultDir, `${qaCase.id}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        result.screenshot = screenshotPath;

        if (result.keywordCount > 0) {
          result.csvDownload = await tryCsvDownload(page);
        }
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
      } finally {
        await page.close();
        if (video) {
          const videoPath = path.join(videoDir, `${qaCase.id}.webm`);
          await video.saveAs(videoPath);
          result.video = videoPath;
        }
        results.push(result);
      }
    }
  } finally {
    await context.close();
  }

  const reportPath = path.join(resultDir, "marketplace-extension-qa.latest.json");
  await fs.writeFile(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  console.log(JSON.stringify(results, null, 2));

  for (const result of results) {
    expect.soft(result.error, `${result.id} should finish without a collection error`).toBeUndefined();
    expect.soft(result.panelVisible, `${result.id} should inject the extension panel`).toBe(true);
    expect.soft(result.keywordCount, `${result.id} should collect at least one keyword`).toBeGreaterThan(0);
    expect.soft(result.csvDownload, `${result.id} should export CSV`).toBe("ok");
  }
});

async function dismissCookiePrompts(page: import("@playwright/test").Page): Promise<void> {
  const labels = ["Kabul Et", "Tümünü Kabul Et", "Tumunu Kabul Et", "Accept All", "Accept"];

  for (const label of labels) {
    const button = page.getByRole("button", { name: label }).first();
    try {
      if (await button.isVisible({ timeout: 800 })) {
        await button.click({ timeout: 2_000 });
        await page.waitForTimeout(300);
        return;
      }
    } catch {
      // Cookie prompts differ by marketplace and region; absence is expected.
    }
  }
}

async function configurePanelForSmokeRun(page: import("@playwright/test").Page, seed: string): Promise<void> {
  const seedInput = page.locator("#bluedev-keyword-radar-host input[aria-label='Seed keyword']");
  await seedInput.click({ timeout: 10_000 });
  await seedInput.press("Control+A");
  await seedInput.type(seed, { delay: 15 });

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

    const fastLabel = Array.from(root.querySelectorAll<HTMLLabelElement>(".speed-grid .speed-option")).find((label) => label.textContent?.includes("Fast"));
    const fastInput = fastLabel?.querySelector<HTMLInputElement>("input[type='radio']");
    if (fastInput && !fastInput.checked) {
      fastInput.click();
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
      return status === "Collected" || status === "Error" || rows > 0 || Boolean(error);
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
  await page.waitForTimeout(250);
}

async function readPanelState(page: import("@playwright/test").Page): Promise<Partial<QaResult>> {
  return page.locator("#bluedev-keyword-radar-host").evaluate((host) => {
    const root = host.shadowRoot;
    if (!root) {
      throw new Error("Keyword Radar shadow root was not found.");
    }

    const metrics = Array.from(root.querySelectorAll(".metrics span strong")).map((element) => Number.parseInt(element.textContent?.trim() ?? "0", 10) || 0);
    const rows = Array.from(root.querySelectorAll("tbody tr")).slice(0, 12).map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      const keyword = cells[0]?.querySelector("strong")?.textContent?.trim() ?? "";
      const detail = cells[0]?.querySelector("small")?.textContent?.trim() ?? "";
      return {
        keyword,
        detail,
        hits: cells[1]?.textContent?.trim() ?? "",
        score: cells[2]?.textContent?.trim() ?? ""
      };
    });
    const actions = Array.from(root.querySelectorAll<HTMLElement>(".analysis-list p")).map((paragraph) => paragraph.innerText.replace(/\s+/g, " ").trim()).filter(Boolean);

    return {
      status: root.querySelector(".status")?.textContent?.trim(),
      error: root.querySelector(".error")?.textContent?.trim() || undefined,
      keywordCount: metrics[0] ?? 0,
      hitCount: metrics[1] ?? 0,
      queryCount: metrics[2] ?? 0,
      rows,
      actions
    };
  });
}

async function tryCsvDownload(page: import("@playwright/test").Page): Promise<QaResult["csvDownload"]> {
  try {
    const downloadPromise = page.waitForEvent("download", { timeout: 8_000 });
    await page.locator("#bluedev-keyword-radar-host").evaluate((host) => {
      const root = host.shadowRoot;
      const csvButton = Array.from(root?.querySelectorAll<HTMLButtonElement>(".toolbar button") ?? []).find((button) => button.title === "Export CSV");
      if (!csvButton || csvButton.disabled) {
        throw new Error("CSV button was not available.");
      }
      csvButton.click();
    });
    const download = await downloadPromise;
    await download.path();
    return "ok";
  } catch {
    return "failed";
  }
}
