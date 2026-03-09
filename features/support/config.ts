/**
 * @fileoverview Environment configuration loader.
 *
 * Loads the correct .env file based on the ENV environment variable.
 * Defaults to 'qa' if not specified. Provides a typed configuration
 * object for use across the test framework.
 *
 * Usage:
 *   ENV=stg npm test        → loads env/stg.env
 *   ENV=qa npm test         → loads env/qa.env
 *   npm test                → loads env/qa.env (default)
 *
 * @module config
 */
import dotenv from "dotenv";
import path from "path";

/** Supported Playwright browser types */
export type BrowserName = "chromium" | "firefox" | "webkit";

/**
 * Maps user-friendly browser names to Playwright browser types.
 *
 * @param {string | undefined} input - Browser name from env var (e.g., 'chrome', 'firefox', 'safari').
 * @returns {BrowserName} The corresponding Playwright browser type.
 */
function parseBrowser(input?: string): BrowserName {
  const mapping: Record<string, BrowserName> = {
    chrome: "chromium",
    chromium: "chromium",
    firefox: "firefox",
    ff: "firefox",
    safari: "webkit",
    webkit: "webkit",
  };

  const key = (input || "chrome").toLowerCase().trim();
  const browser = mapping[key];

  if (!browser) {
    console.warn(
      `[Config] Unknown browser "${input}". ` +
        `Supported: chrome, firefox, safari. Falling back to chromium.`,
    );
    return "chromium";
  }

  return browser;
}

/**
 * Typed interface for environment configuration values.
 */
export interface EnvironmentConfig {
  /** Base URL of the application under test */
  BASE_URL: string;
  /** Login username/phone number */
  FAHASA_USERNAME: string;
  /** Login password */
  FAHASA_PASSWORD: string;
  /** Whether to run the browser in headless mode */
  HEADLESS: boolean;
  /** Slow motion delay in milliseconds (0 = no delay) */
  SLOW_MO: number;
  /** Current environment name (qa, stg, dev) */
  ENV_NAME: string;
  /** Browser to use: 'chromium' | 'firefox' | 'webkit' */
  BROWSER: BrowserName;
}

/**
 * Loads the environment configuration from the appropriate .env file.
 *
 * Resolution order:
 *  1. CLI: ENV variable (e.g., ENV=stg)
 *  2. CLI: BROWSER variable (e.g., BROWSER=firefox)
 *  3. HEADED variable overrides HEADLESS from .env
 *  4. Falls back to 'qa' environment, 'chromium' browser
 *
 * @returns {EnvironmentConfig} The typed configuration object.
 * @throws {Error} If the .env file cannot be loaded.
 */
export function loadConfig(): EnvironmentConfig {
  const envName: string = process.env.ENV || "qa";
  const envPath: string = path.resolve(process.cwd(), "env", `${envName}.env`);

  // Load environment variables from the resolved .env file
  const result = dotenv.config({ path: envPath, quiet: true });

  if (result.error && !process.env.FAHASA_USERNAME) {
    console.warn(
      `[Config] Warning: Could not load env file at "${envPath}". ` +
        `Using existing environment variables. Error: ${result.error.message}`,
    );
  }

  // HEADED CLI override: if HEADED=true is set, force headless=false
  const isHeaded: boolean = process.env.HEADED === "true";
  const isHeadless: boolean = isHeaded
    ? false
    : process.env.HEADLESS !== "false";

  return {
    BASE_URL: process.env.BASE_URL || "https://www.fahasa.com",
    FAHASA_USERNAME: process.env.FAHASA_USERNAME || "",
    FAHASA_PASSWORD: process.env.FAHASA_PASSWORD || "",
    HEADLESS: isHeadless,
    SLOW_MO: parseInt(process.env.SLOW_MO || "0", 10),
    ENV_NAME: envName,
    BROWSER: parseBrowser(process.env.BROWSER),
  };
}
