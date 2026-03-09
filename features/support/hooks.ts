/**
 * @fileoverview Cucumber hooks for Playwright browser lifecycle management.
 *
 * Manages browser launch/teardown (BeforeAll/AfterAll) and per-scenario
 * context creation/cleanup (Before/After). Handles screenshot capture on
 * failure and video attachment to Allure reports.
 *
 * @module hooks
 */
import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  Status,
  setDefaultTimeout,
} from "@cucumber/cucumber";
import { chromium, firefox, webkit, BrowserType } from "playwright";
import { CustomWorld } from "./world";
import { EnvironmentConfig, BrowserName, loadConfig } from "./config";
import fs from "fs";
import path from "path";

/**
 * Set default step timeout to 120 seconds.
 * Fahasa pages load slowly (Vue.js SPA, Magento backend),
 * so the default 5000ms is insufficient.
 */
setDefaultTimeout(120_000);

/** Map of Playwright browser type launchers */
const browserTypes: Record<BrowserName, BrowserType> = {
  chromium,
  firefox,
  webkit,
};

/**
 * BeforeAll Hook — Launches the shared Playwright browser instance.
 * Supports chromium, firefox, and webkit based on BROWSER env var.
 * Runs once before all scenarios in the test suite.
 */
BeforeAll(async function (): Promise<void> {
  const config: EnvironmentConfig = loadConfig();
  const browserType: BrowserType = browserTypes[config.BROWSER];

  console.log(
    `[Hook] Launching ${config.BROWSER} browser (env: ${config.ENV_NAME}, headless: ${config.HEADLESS})`,
  );

  CustomWorld.browser = await browserType.launch({
    headless: config.HEADLESS,
    slowMo: config.SLOW_MO,
    args:
      config.BROWSER === "chromium"
        ? [
            // ── Anti-bot detection flags ──────────────────────────────
            "--disable-blink-features=AutomationControlled",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-infobars",
            "--window-size=1280,720",
            "--disable-extensions",
          ]
        : [],
  });
});

/**
 * AfterAll Hook — Closes the shared browser instance.
 * Runs once after all scenarios have completed.
 */
AfterAll(async function (): Promise<void> {
  if (CustomWorld.browser) {
    await CustomWorld.browser.close();
    CustomWorld.browser = null;
  }
});

/**
 * Before Hook — Creates a fresh BrowserContext and Page for each scenario.
 * Provides complete test isolation with video recording enabled.
 */
Before(async function (this: CustomWorld): Promise<void> {
  if (!CustomWorld.browser) {
    throw new Error(
      "Browser not launched. Ensure BeforeAll hook ran successfully.",
    );
  }

  this.context = await CustomWorld.browser.newContext({
    baseURL: this.config.BASE_URL,
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: "videos/",
      size: { width: 1280, height: 720 },
    },
    ignoreHTTPSErrors: true,
    // ── Anti-bot detection: mimic real Chrome browser ──────────
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
  });

  this.page = await this.context.newPage();

  // ── Stealth: patch navigator properties to bypass Cloudflare ──
  // NOTE: Uses string form to avoid TS errors (runs in browser context, not Node)
  await this.page.addInitScript(`
    // Hide webdriver flag
    Object.defineProperty(navigator, 'webdriver', { get: () => false });

    // Fake plugins array (real Chrome always has plugins)
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Fake languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['vi-VN', 'vi', 'en-US', 'en'],
    });

    // Remove Chrome DevTools detection
    window.chrome = { runtime: {} };

    // Fake permissions query
    const originalQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);
  `);
});

/**
 * After Hook — Performs cleanup after each scenario:
 *  1. Takes a screenshot on failure and attaches it to the Allure report
 *  2. Closes the browser context (which finalizes video recording)
 *  3. Attaches the recorded video to the Allure report
 */
After(async function (this: CustomWorld, scenario): Promise<void> {
  // ── Step 1: Capture screenshot on failure ────────────────────────
  if (scenario.result?.status === Status.FAILED && this.page) {
    try {
      // Ensure screenshots directory exists
      const screenshotDir: string = path.resolve("screenshots");
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      // Generate a unique screenshot filename from scenario name
      const scenarioName: string = scenario.pickle.name.replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      const timestamp: string = new Date().toISOString().replace(/[:.]/g, "-");
      const screenshotPath: string = path.join(
        screenshotDir,
        `${scenarioName}_${timestamp}.png`,
      );

      // Take screenshot and save to file
      const screenshotBuffer: Buffer = await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // Attach screenshot to Allure report
      this.attach(screenshotBuffer, "image/png");
      console.log(`[Hook] Screenshot saved: ${screenshotPath}`);
    } catch (error) {
      console.error(
        `[Hook] Failed to capture screenshot for scenario "${scenario.pickle.name}". ` +
          `Error: ${(error as Error).message}`,
      );
    }
  }

  // ── Step 2: Close context and get video path ─────────────────────
  let videoPath: string | null = null;

  try {
    if (this.page) {
      const video = this.page.video();
      if (video) {
        videoPath = await video.path();
      }
    }
  } catch {
    // Video path retrieval failed — continue cleanup
  }

  try {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.page = null;
    }
  } catch {
    // Context close failed — ensure cleanup
    this.context = null;
    this.page = null;
  }

  // ── Step 3: Attach video to Allure report ────────────────────────
  if (videoPath) {
    try {
      // Wait briefly for video file to be finalized
      await new Promise<void>((resolve) => setTimeout(resolve, 1_000));

      if (fs.existsSync(videoPath)) {
        const videoBuffer: Buffer = fs.readFileSync(videoPath);
        this.attach(videoBuffer, "video/webm");
        console.log(`[Hook] Video attached: ${videoPath}`);
      }
    } catch (error) {
      console.error(
        `[Hook] Failed to attach video for scenario "${scenario.pickle.name}". ` +
          `Error: ${(error as Error).message}`,
      );
    }
  }
});
