/**
 * @fileoverview ProductDetailPage — Page Object for a Fahasa product detail page.
 *
 * URL pattern: https://www.fahasa.com/{product-slug}.html
 *
 * After clicking "Thêm vào giỏ hàng" (Add to Cart), Fahasa shows a toast
 * notification rather than immediately redirecting to the cart page.
 * A 2-second wait is used to allow the page to process the add-to-cart request.
 *
 * @module ProductDetailPage
 */
import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

export class ProductDetailPage extends BasePage {
  // ── Fixed Locators (private) ─────────────────────────────────────
  /** @private Combined selector for the product title heading */
  private readonly productTitle: string = 'h1.fhs_name_product_desktop';

  /** @private Combined selector for the current product price */
  private readonly productPrice: string = '.fhs-price-box .price, .product-info .price';

  /** @private CSS selector for the quantity input field */
  private readonly quantityInput: string = 'input#qty, input[name="qty"]';

  /** @private Combined selector for the "Add to Cart" button */
  private readonly addToCartButton: string = 'button.btn-cart-to-cart, button[id*="add-to-cart"]';

  /** @private Combined selector for the "Buy Now" button */
  private readonly buyNowButton: string = 'button.btn-buy-now, .btn-buy-now';

  /**
   * Creates a new ProductDetailPage instance.
   * @param {Page} page - The Playwright Page instance.
   */
  constructor(page: Page) {
    super(page);
  }

  // ── Dynamic Locators (public getters) ────────────────────────────

  /**
   * Returns a locator for a product attribute/specification by its label.
   *
   * @param {string} attributeName - The label of the attribute (e.g., "Nhà xuất bản", "Tác giả").
   * @returns {Locator} A Playwright Locator targeting the attribute value.
   */
  public locatorProductAttributeByName(attributeName: string): Locator {
    return this.page.locator(
      `//td[normalize-space(text())='${attributeName}']/following-sibling::td`
    );
  }

  /**
   * Returns a locator for a product image by its alt text.
   *
   * @param {string} altText - The alt text of the image.
   * @returns {Locator} A Playwright Locator targeting the image element.
   */
  public locatorProductImageByAlt(altText: string): Locator {
    return this.page.locator(`img[alt*='${altText}']`);
  }

  // ── Page Actions ─────────────────────────────────────────────────

  /**
   * Retrieves the product title/name displayed on the page.
   *
   * @returns {Promise<string>} The trimmed product title text.
   * @throws {Error} If the product title element is not found.
   */
  public async getProductTitle(): Promise<string> {
    try {
      // const text = await this.page
      //   .locator(this.productTitle)
      //   .first()
      //   .innerText();
      const locator: Locator = this.page.locator(this.productTitle).first();
      //inner text always return string, textcontent return null if element is empty
      const text: string = (await locator.innerText());

      console.log('Product title: ' + text);
      
      //after pop, text from string become string | undefined so we still need ?? '' to handle the undefined case
      const lines = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      return lines[lines.length - 1];
    } catch (error) {
      throw new Error(
        `[ProductDetailPage] Failed to get product title. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Retrieves the current product price text (e.g., "254.000 đ").
   *
   * @returns {Promise<string>} The trimmed price text.
   * @throws {Error} If the price element is not found.
   */
  public async getProductPrice(): Promise<string> {
    try {
      const locator: Locator = this.page.locator(this.productPrice).first();
      await locator.waitFor({ state: 'visible', timeout: 10_000 });
      return ((await locator.textContent()) ?? '').trim();
    } catch (error) {
      throw new Error(
        `[ProductDetailPage] Failed to get product price. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Sets the quantity value in the quantity input field.
   *
   * @param {number} qty - The desired quantity value.
   * @returns {Promise<void>}
   * @throws {Error} If the quantity input is not interactable.
   */
  public async setQuantity(qty: number): Promise<void> {
    try {
      const locator: Locator = this.page.locator(this.quantityInput).first();
      await locator.waitFor({ state: 'visible' });
      await locator.fill(String(qty));
    } catch (error) {
      throw new Error(
        `[ProductDetailPage] Failed to set quantity to ${qty}. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Clicks the "Add to Cart" button and waits for the page to process the request.
   * Auto-dismisses any JavaScript dialogs (alert/confirm) that may appear.
   *
   * @returns {Promise<void>}
   * @throws {Error} If the Add to Cart button is not visible or click fails.
   */
  public async addToCart(): Promise<void> {
    try {
      const locator: Locator = this.page.locator(this.addToCartButton).first();
      await locator.waitFor({ state: 'visible', timeout: 10_000 });

      // Auto-dismiss any JS dialogs that may appear during add-to-cart
      this.page.once('dialog', async (dialog) => { await dialog.dismiss(); });

      await locator.click();
      await this.page.waitForTimeout(2_000);
    } catch (error) {
      throw new Error(
        `[ProductDetailPage] Failed to add product to cart. ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Checks whether the current URL indicates a product detail page.
   *
   * @returns {boolean} True if the URL contains ".html" (product page pattern).
   */
  public isOnProductPage(): boolean {
    return this.getCurrentUrl().includes('.html');
  }

  /**
   * Checks whether the "Add to Cart" button is visible on the page.
   *
   * @returns {Promise<boolean>} True if the button is visible.
   */
  public async isAddToCartButtonVisible(): Promise<boolean> {
    return this.isVisible(this.addToCartButton);
  }
}
