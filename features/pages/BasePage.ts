/**
 * @fileoverview BasePage — Abstract base class for all Page Objects.
 *
 * Provides common browser interaction methods with built-in error handling.
 * All methods wrap Playwright actions in try-catch blocks and throw
 * descriptive errors for easier debugging.
 *
 * @module BasePage
 */
import { Page, Locator } from 'playwright';

export class BasePage {
  /**
   * The Playwright Page instance used for browser interactions.
   * @protected — accessible by subclasses only.
   */
  protected readonly page: Page;

  /**
   * Creates a new BasePage instance.
   * @param {Page} page - The Playwright Page instance to interact with.
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigates to the specified URL relative to the base URL.
   * Waits for the DOM content to be loaded before returning.
   *
   * @param {string} url - The relative URL path to navigate to.
   * @returns {Promise<void>}
   * @throws {Error} If navigation fails or times out.
   */
  protected async goto(url: string): Promise<void> {
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    } catch (error) {
      throw new Error(
        `[BasePage] Failed to navigate to "${url}". ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Clicks on an element identified by its CSS/XPath selector string.
   * Waits for the element to be visible before clicking.
   *
   * @param {string} selector - The CSS or XPath selector of the element.
   * @returns {Promise<void>}
   * @throws {Error} If the element is not visible or click fails.
   */
  protected async click(selector: string): Promise<void> {
    try {
      const locator: Locator = this.page.locator(selector);
      await locator.waitFor({ state: 'visible', timeout: 10_000 });
      await locator.click();
    } catch (error) {
      throw new Error(
        `[BasePage] Failed to click element "${selector}". ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fills a text input element with the specified value.
   * Waits for the element to be visible before filling.
   *
   * @param {string} selector - The CSS or XPath selector of the input element.
   * @param {string} text - The text value to fill into the input.
   * @returns {Promise<void>}
   * @throws {Error} If the element is not visible or fill fails.
   */
  protected async fill(selector: string, text: string): Promise<void> {
    try {
      const locator: Locator = this.page.locator(selector);
      await locator.waitFor({ state: 'visible', timeout: 10_000 });
      await locator.fill(text);
    } catch (error) {
      throw new Error(
        `[BasePage] Failed to fill element "${selector}" with text "${text}". ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Retrieves the visible text content of an element.
   *
   * @param {string} selector - The CSS or XPath selector of the element.
   * @returns {Promise<string>} The trimmed text content, or empty string if not found.
   * @throws {Error} If the element cannot be located.
   */
  protected async getText(selector: string): Promise<string> {
    try {
      const locator: Locator = this.page.locator(selector);
      await locator.waitFor({ state: 'visible', timeout: 10_000 });
      return ((await locator.textContent()) ?? '').trim();
    } catch (error) {
      throw new Error(
        `[BasePage] Failed to get text from element "${selector}". ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Checks whether an element is currently visible on the page.
   *
   * @param {string} selector - The CSS or XPath selector of the element.
   * @returns {Promise<boolean>} True if the element is visible, false otherwise.
   */
  protected async isVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.locator(selector).isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Waits for a fixed amount of time. Use sparingly —
   * prefer waiting for specific conditions instead.
   *
   * @param {number} ms - The number of milliseconds to wait.
   * @returns {Promise<void>}
   */
  protected async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Returns the current page URL.
   *
   * @returns {string} The full URL of the current page.
   */
  public getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Waits for the page URL to match the given pattern.
   *
   * @param {string | RegExp} urlPattern - The URL pattern to wait for.
   * @returns {Promise<void>}
   * @throws {Error} If the URL does not match within the timeout.
   */
  protected async waitForUrl(urlPattern: string | RegExp): Promise<void> {
    try {
      await this.page.waitForURL(urlPattern, { timeout: 30_000 });
    } catch (error) {
      throw new Error(
        `[BasePage] URL did not match pattern "${urlPattern}" within timeout. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Detects Cloudflare Turnstile/challenge page and waits for it to auto-resolve.
   * If Cloudflare blocks the page, it will retry up to `maxRetries` times with
   * page refresh between attempts.
   *
   * @param {number} [maxRetries=3] - Max number of retry attempts.
   * @returns {Promise<void>}
   * @throws {Error} If Cloudflare challenge cannot be resolved after all retries.
   */
  protected async waitForCloudflare(maxRetries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Check if Cloudflare challenge is present
      const isCloudflare: boolean = await this.page
        .locator('text=Verify you are human')
        .isVisible()
        .catch(() => false)
        || await this.page
        .locator('text=Performing security verification')
        .isVisible()
        .catch(() => false)
        || await this.page
        .locator('#challenge-running, #challenge-stage')
        .isVisible()
        .catch(() => false);

      if (!isCloudflare) {
        // No Cloudflare — page loaded normally
        return;
      }

      console.log(
        `[BasePage] Cloudflare challenge detected (attempt ${attempt}/${maxRetries}). ` +
        `Waiting for auto-resolve...`
      );

      // Wait for Cloudflare to auto-resolve (up to 15s per attempt)
      try {
        await this.page.waitForFunction(
          () => !document.querySelector('#challenge-running, #challenge-stage')
                && !document.body.innerText.includes('Verify you are human'),
          { timeout: 15_000 }
        );
        // Successful — wait a moment for redirect
        await this.wait(2_000);
        return;
      } catch {
        // Cloudflare did not auto-resolve — refresh and retry
        if (attempt < maxRetries) {
          console.log(`[BasePage] Cloudflare did not resolve. Refreshing page...`);
          await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
          await this.wait(3_000);
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `[BasePage] Cloudflare challenge could not be resolved after ${maxRetries} attempts. ` +
      `This may happen in headless/Docker mode. ` +
      `Current URL: ${this.page.url()}`
    );
  }
}
