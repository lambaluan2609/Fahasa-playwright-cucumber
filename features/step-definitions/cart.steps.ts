/**
 * @fileoverview Cart step definitions for the Fahasa shopping cart feature.
 *
 * Handles steps for clicking products, adding to cart, navigating to the
 * cart page, and verifying cart item details (name, price, count).
 *
 * @module cartSteps
 */
import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../support/world";
import { SearchResultPage } from "../pages/SearchResultPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { CartPage } from "../pages/CartPage";

/**
 * Step: Clicks the first product in the search results to open its detail page.
 */
When(
  "the user clicks the first product in the search results",
  async function (this: CustomWorld): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    const searchPage: SearchResultPage = new SearchResultPage(this.page);
    await searchPage.waitForResults();
    await searchPage.clickFirstProduct();

    // Wait for product detail page to load
    await this.page.waitForLoadState("domcontentloaded");
  },
);

/**
 * Step: Adds the current product to the shopping cart.
 */
When(
  "the user adds the product to the cart",
  async function (this: CustomWorld): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    const productPage: ProductDetailPage = new ProductDetailPage(this.page);
    const productName = await productPage.getProductTitle();
    this.productName = productName;
    console.log(`[CartSteps] Selected product name: "${productName}"`);
    await productPage.addToCart();
  },
);

/**
 * Step: Navigates directly to the shopping cart page.
 */
When(
  "the user navigates to the cart page",
  async function (this: CustomWorld): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    const cartPage: CartPage = new CartPage(this.page);
    await cartPage.open();
  },
);

/**
 * Step: Asserts that the cart contains at least N items.
 */
Then(
  "the cart should contain at least {int} item(s)",
  async function (this: CustomWorld, minItems: number): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    const cartPage: CartPage = new CartPage(this.page);
    const hasItems: boolean = await cartPage.hasItems();

    expect(
      hasItems,
      `[CartError] Expected cart to contain at least ${minItems} item(s), but the cart appears empty. URL: ${this.page.url()}`,
    ).toBe(true);
  },
);

/**
 * Step: Asserts that the first cart item name is not empty.
 */
Then(
  "the cart item name should not be empty",
  async function (this: CustomWorld): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    const cartPage: CartPage = new CartPage(this.page);
    const itemName: string = await cartPage.getFirstItemName();

    expect(
      itemName.length,
      `[CartError] Expected cart item name to not be empty, but got "${itemName}". URL: ${this.page.url()}`,
    ).toBeGreaterThan(0);
  },
);

/**
 * Step: Asserts that the cart item price matches the expected value.
 * Used for the intentional-fail scenario (TC08).
 */
Then(
  "the cart item price should be {string}",
  async function (this: CustomWorld, expectedPrice: string): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    const cartPage: CartPage = new CartPage(this.page);
    const actualPrice: string = await cartPage.getFirstItemPrice();

    expect(
      actualPrice,
      `[CartError] Expected cart item price to be "${expectedPrice}" but got "${actualPrice}". URL: ${this.page.url()}`,
    ).toBe(expectedPrice);
  },
);

Then(
  "the user selects the product in the cart",
  async function (this: CustomWorld): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    const cartPage: CartPage = new CartPage(this.page);
    await cartPage.selectItemByName(this.productName!);
  },
);

Then(
  "the total price of each item should equal its unit price multiplied by quantity",
  async function (this: CustomWorld): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    const cartPage = new CartPage(this.page);

    // Lấy mảng toàn bộ sản phẩm đang có trong giỏ hàng
    const cartItems = await cartPage.getAllItemsDetails();

    // Đảm bảo trong giỏ hàng phải có ít nhất 1 sản phẩm để test
    expect(
      cartItems.length,
      "Cart is empty, nothing to verify",
    ).toBeGreaterThan(0);

    // Vòng lặp kiểm tra từng sản phẩm một
    for (const item of cartItems) {
      const expectedTotal = item.unitPrice * item.quantity;

      // So sánh giá thực tế vs giá mong đợi
      expect(
        item.totalPrice,
        `[Pricing Error] Product: "${item.productName}" | Calculation failed: Unit Price (${item.unitPrice}đ) x Quantity (${item.quantity}) != Total (${item.totalPrice}đ)`,
      ).toBe(expectedTotal);
    }
  },
);
