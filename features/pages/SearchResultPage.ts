/**
 * @fileoverview SearchResultPage — Page Object for the Fahasa search results page.
 *
 * Fahasa has 3 different search result layouts depending on login state and entry point:
 *   1. searchengine + not logged in: legacy layout — links inside `.mb-content`
 *   2. searchengine + logged in: new layout — links with `?fhs_campaign=SEARCH`
 *   3. catalogsearch/result: original Magento layout — links inside `.products-grid`
 *
 * This Page Object auto-detects and handles all three layouts transparently.
 *
 * @module SearchResultPage
 */
import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

export class SearchResultPage extends BasePage {
  // ── Fixed Locators (private) ─────────────────────────────────────
  /** @private Selector for the search term header text, e.g., "Doraemon (358 kết quả)" */
  private readonly searchTermText: string = '.search-term-text, .fhs-search-result-title';

  /** @private Selector for product links in legacy layout (searchengine, not logged in) */
  private readonly legacyProductLinks: string = '.mb-content a[href*=".html"]';

  /** @private Selector for product card containers in the new layout */
  private readonly productCards: string = '.fhs-product-item, .product-item';

  /** @private Selector for product links with fhs_campaign=SEARCH query param (new layout, logged in) */
  private readonly searchProductLinks: string = 'a[href*="fhs_campaign=SEARCH"]';

  /** @private Combined selector for product links across multiple catalog layouts */
  private readonly catalogProductLinks: string =
    '.products-grid a[href*=".html"], .fhs-product-item a[href*=".html"], li.product-item a.product-item-photo';

  /** @private Selector for the "no results" message */
  private readonly noResultsMessage: string = '.fhs-search-no-result, .search-no-result, .message.notice';

  /**
   * Creates a new SearchResultPage instance.
   * @param {Page} page - The Playwright Page instance.
   */
  constructor(page: Page) {
    super(page);
  }

  // ── Dynamic Locators (public getters) ────────────────────────────

  /**
   * Returns a locator targeting a specific product by its name text.
   *
   * @param {string} productName - The visible product name to locate.
   * @returns {Locator} A Playwright Locator targeting the product link.
   */
  public locatorProductByName(productName: string): Locator {
    return this.page.locator(
      `//a[contains(@href,'.html') and contains(normalize-space(text()),'${productName}')]`
    );
  }

  /**
   * Returns a locator for a filter/sort option by its label text.
   *
   * @param {string} optionText - The visible text of the filter option.
   * @returns {Locator} A Playwright Locator targeting the filter option.
   */
  public locatorFilterOptionByText(optionText: string): Locator {
    return this.page.locator(
      `//div[contains(@class,'filter')]//a[normalize-space(text())='${optionText}']`
    );
  }

  // ── Page Actions ─────────────────────────────────────────────────

  /**
   * Waits for the search results page to fully load.
   * Uses a polling strategy: checks every 500ms for product links
   * across all three possible layouts until at least one is found.
   *
   * @param {number} [timeout=25000] - Maximum wait time in milliseconds.
   * @returns {Promise<void>}
   * @throws {Error} If no products are found after the timeout period.
   */
  public async waitForResults(timeout: number = 25_000): Promise<void> {
    try {
      await this.page.waitForLoadState('domcontentloaded');

      // Try to wait for loading spinner to disappear
      try {
        await this.page.waitForSelector('.loading-mask, .fhs-loading, .spinner', {
          state: 'hidden',
          timeout: 8_000,
        });
      } catch {
        // No spinner present — continue
      }

      // Poll for product links across all layouts
      const deadline: number = Date.now() + timeout;
      while (Date.now() < deadline) {
        if ((await this.page.locator(this.searchProductLinks).count()) > 0) return;
        if ((await this.page.locator(this.legacyProductLinks).count()) > 0) return;
        if ((await this.page.locator(this.catalogProductLinks).count()) > 0) return;
        await this.page.waitForTimeout(500);
      }

      throw new Error(`No products found after ${timeout}ms`);
    } catch (error) {
      throw new Error(
        `[SearchResultPage] Failed to wait for search results. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Detects the current search result layout in priority order:
   * new (searchengine logged in) → catalog (Magento) → legacy (searchengine not logged in).
   *
   * @private
   * @returns {Promise<'new' | 'catalog' | 'legacy'>} The detected layout type.
   */
  private async detectLayout(): Promise<'new' | 'catalog' | 'legacy'> {
    if ((await this.page.locator(this.searchProductLinks).count()) > 0) return 'new';
    if ((await this.page.locator(this.catalogProductLinks).count()) > 0) return 'catalog';
    return 'legacy';
  }

  /**
   * Returns de-duplicated product link locators from the current layout.
   * Filters out navigation/filter links and duplicate product URLs.
   *
   * @private
   * @returns {Promise<Locator[]>} Array of unique product Locators.
   */
  private async getRealProductLinks(): Promise<Locator[]> {
    const layout: string = await this.detectLayout();

    if (layout === 'new') {
      const count: number = await this.page.locator(this.searchProductLinks).count();
      const result: Locator[] = [];
      const seen: Set<string> = new Set();

      for (let i: number = 0; i < count; i++) {
        const link: Locator = this.page.locator(this.searchProductLinks).nth(i);
        const href: string = (await link.getAttribute('href')) ?? '';
        const text: string = ((await link.textContent()) ?? '').trim();
        const productPath: string = href.split('?')[0];

        if (!seen.has(productPath) && text.length > 3) {
          seen.add(productPath);
          result.push(link);
        }
      }
      return result;
    }

    if (layout === 'catalog') {
      const count: number = await this.page.locator(this.catalogProductLinks).count();
      const result: Locator[] = [];
      const seen: Set<string> = new Set();

      for (let i: number = 0; i < count; i++) {
        const link: Locator = this.page.locator(this.catalogProductLinks).nth(i);
        const href: string = (await link.getAttribute('href')) ?? '';
        const productPath: string = href.split('?')[0];

        if (!seen.has(productPath) && href.includes('.html')) {
          seen.add(productPath);
          result.push(link);
        }
      }
      return result;
    }

    // Legacy layout
    const count: number = await this.page.locator(this.legacyProductLinks).count();
    const result: Locator[] = [];
    for (let i: number = 0; i < count; i++) {
      const link: Locator = this.page.locator(this.legacyProductLinks).nth(i);
      const href: string = (await link.getAttribute('href')) ?? '';
      const text: string = ((await link.textContent()) ?? '').trim();
      if (!href.includes('searchengine') && text.length > 5) {
        result.push(link);
      }
    }
    return result;
  }

  /**
   * Gets the search term header text, e.g., "Doraemon (358 kết quả)".
   *
   * @returns {Promise<string>} The search term text, or empty string if not found.
   */
  public async getSearchTermText(): Promise<string> {
    try {
      const locator: Locator = this.page.locator(this.searchTermText);
      await locator.waitFor({ state: 'visible', timeout: 10_000 });
      return ((await locator.textContent()) ?? '').trim();
    } catch {
      return '';
    }
  }

  /**
   * Returns the number of unique products displayed on the results page.
   *
   * @returns {Promise<number>} The count of filtered, unique product links.
   */
  public async getProductCount(): Promise<number> {
    return (await this.getRealProductLinks()).length;
  }

  /**
   * Gets the name/title of the first product in the results.
   *
   * @returns {Promise<string>} The first product name, or empty string if none.
   */
  public async getFirstProductName(): Promise<string> {
    const links: Locator[] = await this.getRealProductLinks();
    if (links.length === 0) return '';
    return ((await links[0].textContent()) ?? '').trim();
  }

  /**
   * Clicks on the first product in the search results and waits for
   * the product detail page to load.
   *
   * @returns {Promise<void>}
   * @throws {Error} If no products are found or click fails.
   */
  public async clickFirstProduct(): Promise<void> {
    try {
      const links: Locator[] = await this.getRealProductLinks();
      if (links.length === 0) {
        throw new Error('No products found in search results');
      }
      await links[0].click();
      await this.page.waitForLoadState('domcontentloaded');
    } catch (error) {
      throw new Error(
        `[SearchResultPage] Failed to click first product. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Checks whether the search results page has at least one product.
   *
   * @returns {Promise<boolean>} True if results contain products.
   */
  public async hasResults(): Promise<boolean> {
    return (await this.getProductCount()) > 0;
  }

  /**
   * Returns the current search results page URL.
   *
   * @returns {string} The full URL of the search results page.
   */
  public getSearchUrl(): string {
    return this.getCurrentUrl();
  }
}
