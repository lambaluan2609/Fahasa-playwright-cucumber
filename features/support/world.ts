/**
 * @fileoverview Custom Cucumber World class for Playwright integration.
 *
 * Extends Cucumber's World to provide browser, context, and page instances
 * to all step definitions. Holds shared browser state and per-scenario
 * context/page references managed by hooks.
 *
 * @module CustomWorld
 */
import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from 'playwright';
import { EnvironmentConfig, loadConfig } from './config';

/**
 * Custom World class that holds browser state and page objects.
 * Each scenario gets its own BrowserContext and Page for isolation.
 */
export class CustomWorld extends World {
  /** Shared browser instance across all scenarios */
  public static browser: Browser | null = null;

  /** Per-scenario browser context (with video recording) */
  public context: BrowserContext | null = null;

  /** Per-scenario page instance */
  public page: Page | null = null;

  /** Loaded environment configuration */
  public config: EnvironmentConfig;

  /** Stores the last added product name for cart validation */
  public productName: string | null = null;

  /**
   * Creates a new CustomWorld instance.
   * Loads the environment configuration on construction.
   *
   * @param {IWorldOptions} options - Cucumber World options.
   */
  constructor(options: IWorldOptions) {
    super(options);
    this.config = loadConfig();
  }
}

// Register the custom world with Cucumber
setWorldConstructor(CustomWorld);
