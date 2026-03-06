/**
 * @fileoverview CartPage — Page Object for the Fahasa shopping cart page.
 *
 * URL: https://www.fahasa.com/checkout/cart/
 *
 * The checkout button (button.btn-checkout) is disabled by default when
 * no products are selected. Call selectAllItems() before checking
 * isCheckoutButtonEnabled().
 *
 * Test intent: Stop at verifying the checkout button — do NOT perform
 * actual checkout to avoid creating real orders.
 *
 * @module CartPage
 */
import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  // ── Fixed Locators (private) ─────────────────────────────────────
  /** @private CSS selector for the "Select All" checkbox on the cart header row */
  private readonly selectAllCheckbox: string = 'input[type="checkbox"]';

  /** @private CSS selector for the first item's quantity input (indicates cart has items) */
  private readonly firstItemQtyInput: string = 'input.qty-carts, input[id^="qty-"]';

  /** @private CSS selector for the "THANH TOÁN" (Checkout) button */
  private readonly checkoutButton: string = 'button.btn-checkout';

  /** @private Combined selector for the cart page title heading */
  private readonly cartTitle: string = 'h1, .fhs-cart-title, .cart-title';

  /** @private Combined selector for the total price display */
  private readonly totalPrice: string = '.fhs-total-price, .grand-total .price, [class*="total-price"] strong';

  /**
   * Creates a new CartPage instance.
   * @param {Page} page - The Playwright Page instance.
   */
  constructor(page: Page) {
    super(page);
  }

  // ── Dynamic Locators (public getters) ────────────────────────────

  /**
   * Returns a locator for a cart item by its product name.
   *
   * @param {string} productName - The name of the product to locate in the cart.
   * @returns {Locator} A Playwright Locator targeting the cart item row.
   */
  public locatorCartItemByName(productName: string): Locator {
    return this.page.locator(
      `//div[contains(@class,'cart-item') or contains(@class,'item-cart')]//a[contains(normalize-space(text()),'${productName}')]`
    );
  }

  /**
   * Returns a locator for a quantity input by the product's row index (0-based).
   *
   * @param {number} index - The zero-based index of the cart item.
   * @returns {Locator} A Playwright Locator targeting the quantity input.
   */
  public locatorQuantityInputByIndex(index: number): Locator {
    return this.page.locator(this.firstItemQtyInput).nth(index);
  }

  // ── Page Actions ─────────────────────────────────────────────────

  /**
   * Navigates directly to the cart page and waits for content to load.
   * Dismisses loading spinners if present.
   *
   * @returns {Promise<void>}
   * @throws {Error} If navigation to the cart page fails.
   */
  public async open(): Promise<void> {
    try {
      await this.goto('/checkout/cart/');
      await this.page.waitForLoadState('domcontentloaded');

      try {
        await this.page.waitForSelector('.loading-mask, .fhs-loading', {
          state: 'hidden',
          timeout: 8_000,
        });
      } catch {
        // No loading spinner — continue
      }

      await this.page.waitForTimeout(1_000);
    } catch (error) {
      throw new Error(
        `[CartPage] Failed to open cart page. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Checks whether the cart contains at least one item.
   * First checks for quantity inputs, then falls back to checkboxes.
   *
   * @returns {Promise<boolean>} True if the cart has items.
   */
  public async hasItems(): Promise<boolean> {
    try {
      const qtyLocator: Locator = this.page.locator(this.firstItemQtyInput).first();
      await qtyLocator.waitFor({ state: 'visible', timeout: 8_000 });
      return true;
    } catch {
      try {
        const checkboxCount: number = await this.page.locator('input.checkbox-add-cart').count();
        return checkboxCount > 0;
      } catch {
        return false;
      }
    }
  }

  /**
   * Retrieves the name of the first product in the cart.
   * Tries multiple selectors in priority order.
   *
   * @returns {Promise<string>} The product name, or empty string if not found.
   */
  public async getFirstItemName(): Promise<string> {
    const selectors: string[] = [
      '.product-item-name-cart',
      '.cart-item-name',
      '.item-cart a[href*=".html"]',
      '.cart-item a[href*=".html"]',
      'a[href*=".html?fhs_campaign"]',
    ];

    for (const sel of selectors) {
      try {
        const text: string = (
          (await this.page.locator(sel).first().textContent({ timeout: 3_000 })) ?? ''
        ).trim();
        if (text.length > 3) return text;
      } catch {
        // Try next selector
      }
    }
    return '';
  }

  /**
   * Retrieves the price of the first product in the cart (e.g., "254.000 đ").
   *
   * @returns {Promise<string>} The price text, or empty string if not found.
   */
  public async getFirstItemPrice(): Promise<string> {
    const selectors: string[] = [
      '.price-finall',
      '.price-final',
      '.cart-price .price',
      '.cartitem-total',
    ];

    for (const sel of selectors) {
      try {
        const text: string = (
          (await this.page.locator(sel).first().textContent({ timeout: 3_000 })) ?? ''
        ).trim();
        if (text.match(/\d/)) return text;
      } catch {
        // Try next selector
      }
    }
    return '';
  }

  /**
   * Parses the cart item count from the cart title heading.
   * Expected format: "GIỎ HÀNG (X sản phẩm)"
   *
   * @returns {Promise<number>} The number of items, or 0 if parsing fails.
   */
  public async getCartItemCount(): Promise<number> {
    try {
      const title: string =
        (await this.page.locator(this.cartTitle).first().textContent({ timeout: 5_000 })) ?? '';
      const match: RegExpMatchArray | null = title.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Checks (ticks) the "Select All" checkbox if it is not already checked.
   * Must be called before checking isCheckoutButtonEnabled().
   *
   * @returns {Promise<void>}
   * @throws {Error} If the checkbox cannot be located or clicked.
   */
  public async selectAllItems(): Promise<void> {
    try {
      const checkbox: Locator = this.page.locator(this.selectAllCheckbox).first();
      await checkbox.waitFor({ state: 'visible', timeout: 10_000 });
      if (!(await checkbox.isChecked())) {
        await checkbox.click();
        await this.page.waitForTimeout(500);
      }
    } catch (error) {
      throw new Error(
        `[CartPage] Failed to select all items in the cart. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Checks whether the checkout button is currently enabled.
   * Returns true when products are selected and ready for checkout.
   *
   * @returns {Promise<boolean>} True if the checkout button is enabled.
   */
  public async isCheckoutButtonEnabled(): Promise<boolean> {
    try {
      const btn: Locator = this.page.locator(this.checkoutButton).first();
      await btn.waitFor({ state: 'visible', timeout: 10_000 });
      return await btn.isEnabled();
    } catch (error) {
      throw new Error(
        `[CartPage] Failed to check checkout button state. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Clicks the checkout button. Only use when testing the checkout flow.
   * ⚠️ In normal E2E tests, stop at isCheckoutButtonEnabled() to avoid creating real orders.
   *
   * @returns {Promise<void>}
   * @throws {Error} If the checkout button is not enabled or click fails.
   */
  public async clickCheckout(): Promise<void> {
    try {
      const btn: Locator = this.page.locator(this.checkoutButton).first();
      await btn.waitFor({ state: 'visible', timeout: 10_000 });
      await btn.click();
      await this.page.waitForLoadState('domcontentloaded');
    } catch (error) {
      throw new Error(
        `[CartPage] Failed to click checkout button. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }
  /**
     * 
     */
    public async selectItemByName(productName: string): Promise<void> {
  try {

    const row = this.page.locator('.item-product-cart', {
      has: this.page.locator(`a:has-text("${productName}")`)
    });

    const checkbox = row.locator('input.checkbox-add-cart');

    await checkbox.waitFor({ state: 'visible' });

    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }

  } catch (error) {
    throw new Error(
      `[CartPage] Failed to select item by name ${productName}. ` +
      `Current URL: ${this.page.url()}. ` +
      `Error: ${(error as Error).message}`
    );
  }
}
}
