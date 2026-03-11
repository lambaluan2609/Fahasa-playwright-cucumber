/**
 * @fileoverview HomePage — Page Object for the Fahasa homepage.
 *
 * Provides methods for interacting with the main navigation,
 * search functionality, and notification popups on fahasa.com.
 *
 * @module HomePage
 */
import { Locator, Page } from "playwright";
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  // ── Fixed Locators (private) ─────────────────────────────────────
  /** @private CSS selector for the desktop search input field */
  private readonly searchInput: string = "input.input-search:visible";

  /** @private CSS selector for the account/login button in header */
  private readonly accountButton: string = ".fhs_top_account_button";

  /** @private CSS selector for the shopping cart icon in header */
  private readonly cartButton: string = 'a[href*="checkout/cart"]';

  /** @private CSS selector for the Fahasa logo */
  private readonly logo: string = "a.logo, .logo a";

  /** @private CSS selector for the notification popup overlay */
  private readonly notificationPopup: string =
    '.fhs-popup-notification, [class*="notification-popup"]';

  /**
   * Creates a new HomePage instance.
   * @param {Page} page - The Playwright Page instance.
   */
  constructor(page: Page) {
    super(page);
  }

  // ── Dynamic Locators (public getters) ────────────────────────────

  /**
   * Returns a locator for a navigation menu item by its visible text.
   *
   * @param {string} itemName - The exact visible text of the menu item.
   * @returns {Locator} A Playwright Locator targeting the menu item.
   */
  public locatorNavigationMenuItemByText(itemName: string): Locator {
    return this.page.locator(
      `//li[contains(@class,'menu-item')]/a[normalize-space(text())='${itemName}']`,
    );
  }

  /**
   * Returns a locator for a category link by its display text.
   *
   * @param {string} categoryName - The visible category name.
   * @returns {Locator} A Playwright Locator targeting the category link.
   */
  public locatorCategoryByText(categoryName: string): Locator {
    return this.page.locator(
      `//a[contains(@class,'cate-link') and normalize-space(text())='${categoryName}']`,
    );
  }

  // ── Page Actions ─────────────────────────────────────────────────

  /**
   * Opens the Fahasa homepage and dismisses notification popups if present.
   *
   * @returns {Promise<void>}
   * @throws {Error} If navigation to the homepage fails.
   */
  public async open(): Promise<void> {
    try {
      await this.goto("/");
      await this.waitForCloudflare();
      await this.dismissNotificationPopup();
    } catch (error) {
      throw new Error(
        `[HomePage] Failed to open homepage. ` +
          `Error: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Dismisses the notification/push permission popup if it appears.
   * Silently ignores if no popup is present.
   *
   * @returns {Promise<void>}
   */
  public async dismissNotificationPopup(): Promise<void> {
    try {
      const popup: Locator = this.page.locator(this.notificationPopup);
      if (await popup.isVisible().catch(() => false)) {
        await this.page.keyboard.press("Escape");
        await this.wait(500);
      }
    } catch {
      // Popup not present — safe to ignore
    }
  }

  /**
   * Types a search keyword into the search bar and submits the search.
   * Waits for the search results page to begin loading.
   *
   * @param {string} keyword - The product search keyword.
   * @returns {Promise<void>}
   * @throws {Error} If the search input is not interactable or search fails.
   */
  public async searchFor(keyword: string): Promise<void> {
    try {
      const searchLocator = this.page.locator(this.searchInput).first();
      await searchLocator.waitFor({ state: "visible", timeout: 5000 });
      await searchLocator.click({ force: true });
      await searchLocator.fill(keyword);
      await this.page.keyboard.press("Enter");
      await this.page.waitForLoadState("load");
    } catch (error) {
      throw new Error(
        `[HomePage] Failed to search for keyword "${keyword}". ` +
          `Current URL: ${this.page.url()}. ` +
          `Error: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Clicks the account/login button in the header to open the login modal.
   *
   * @returns {Promise<void>}
   * @throws {Error} If the account button is not visible or click fails.
   */
  public async clickAccountButton(): Promise<void> {
    try {
      const locator: Locator = this.page.locator(this.accountButton).first();
      await locator.waitFor({ state: "visible", timeout: 10_000 });
      await locator.click();
    } catch (error) {
      throw new Error(
        `[HomePage] Failed to click account button. ` +
          `Current URL: ${this.page.url()}. ` +
          `Error: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Checks whether the search input is visible on the page.
   *
   * @returns {Promise<boolean>} True if the search input is visible.
   */
  public async isSearchInputVisible(): Promise<boolean> {
    return this.isVisible(this.searchInput);
  }
}
