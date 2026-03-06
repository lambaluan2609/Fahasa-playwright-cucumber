/**
 * @fileoverview Search step definitions for the Fahasa search feature.
 *
 * Handles steps related to searching for products, verifying search
 * results page display, keyword presence, and product count.
 *
 * @module searchSteps
 */
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { HomePage } from '../pages/HomePage';
import { SearchResultPage } from '../pages/SearchResultPage';

/**
 * Step: Searches for a product keyword using the homepage search bar.
 */
When('the user searches for {string}', async function (this: CustomWorld, keyword: string): Promise<void> {
  if (!this.page) throw new Error('Page not initialized');

  const homePage: HomePage = new HomePage(this.page);
  await homePage.searchFor(keyword);

  // Wait for navigation after search — Fahasa may use /searchengine or AJAX
  try {
    await this.page.waitForURL(/searchengine|catalogsearch/, { timeout: 15_000 });
  } catch {
    // AJAX search: URL may not change — wait for results to load instead
    await this.page.waitForTimeout(3_000);
  }
});

/**
 * Step: Asserts that the search results page is displayed.
 * Checks that the URL matches either searchengine or catalogsearch patterns.
 */
Then('the search results page should be displayed', async function (this: CustomWorld): Promise<void> {
  if (!this.page) throw new Error('Page not initialized');

  const searchPage: SearchResultPage = new SearchResultPage(this.page);
  const currentUrl: string = this.page.url();

  // Fahasa may use /searchengine URL or AJAX search (URL stays on homepage)
  // Verify by checking URL pattern OR that search results are present on page
  const urlHasSearchPattern: boolean = /searchengine|catalogsearch/.test(currentUrl);
  let hasProducts: boolean = false;

  if (!urlHasSearchPattern) {
    // AJAX search: verify results loaded even though URL didn't change
    try {
      await searchPage.waitForResults(15_000);
      hasProducts = await searchPage.hasResults();
    } catch {
      hasProducts = false;
    }
  }

  expect(
    urlHasSearchPattern || hasProducts,
    `[SearchError] Expected search results page to be displayed. URL: "${currentUrl}", products found: ${hasProducts}`
  ).toBe(true);
});

/**
 * Step: Asserts that the search results contain the searched keyword.
 * Checks the search term text header or the URL for the keyword.
 */
Then(
  'the search results should contain the keyword {string}',
  async function (this: CustomWorld, keyword: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    const searchPage: SearchResultPage = new SearchResultPage(this.page);

    // Wait for search results to load
    await searchPage.waitForResults();

    // Check search term text OR URL for keyword presence
    const searchTermText: string = await searchPage.getSearchTermText();
    const currentUrl: string = this.page.url().toLowerCase();
    const containsKeyword: boolean =
      searchTermText.toLowerCase().includes(keyword.toLowerCase()) ||
      currentUrl.includes(keyword.toLowerCase());

    expect(
      containsKeyword,
      `[SearchError] Expected search results to contain keyword "${keyword}". ` +
      `Search term text: "${searchTermText}". URL: ${this.page.url()}`
    ).toBe(true);
  }
);

/**
 * Step: Asserts that the search results contain at least N products.
 * Uses {int} parameter for the minimum count.
 */
Then(
  'the search results should have at least {int} product(s)',
  async function (this: CustomWorld, minResults: number): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    const searchPage: SearchResultPage = new SearchResultPage(this.page);
    await searchPage.waitForResults();

    const productCount: number = await searchPage.getProductCount();
    expect(
      productCount,
      `[SearchError] Expected at least ${minResults} product(s) in search results, but found ${productCount}. URL: ${this.page.url()}`
    ).toBeGreaterThanOrEqual(minResults);
  }
);
