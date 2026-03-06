/**
 * @fileoverview Common step definitions shared across all features.
 *
 * Provides reusable steps for navigation, page state assertions,
 * and common actions like opening the homepage.
 *
 * @module commonSteps
 */
import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { HomePage } from '../pages/HomePage';

/**
 * Step: Opens the Fahasa homepage and dismisses popups.
 * Used as the Background step for most features.
 */
Given('the user opens the Fahasa homepage', async function (this: CustomWorld): Promise<void> {
  if (!this.page) throw new Error('Page not initialized');

  const homePage: HomePage = new HomePage(this.page);
  await homePage.open();
});

/**
 * Step: Opens the homepage AND logs in with valid credentials from .env.
 * Used for scenarios that require an authenticated user.
 */
Given('the user opens the Fahasa homepage and logs in', async function (this: CustomWorld): Promise<void> {
  if (!this.page) throw new Error('Page not initialized');

  const homePage: HomePage = new HomePage(this.page);
  await homePage.open();
  await homePage.clickAccountButton();

  const { LoginPage } = await import('../pages/LoginPage');
  const loginPage: InstanceType<typeof LoginPage> = new LoginPage(this.page);
  await loginPage.login(this.config.FAHASA_USERNAME, this.config.FAHASA_PASSWORD);

  // Wait for redirect to account page after login
  await this.page.waitForURL(/customer\/account/, { timeout: 30_000 });
});

/**
 * Step: Asserts that the page title contains the expected text.
 */
Then('the page title should contain {string}', async function (this: CustomWorld, expectedTitle: string): Promise<void> {
  if (!this.page) throw new Error('Page not initialized');

  const actualTitle: string = await this.page.title();
  const titleMatches: boolean = actualTitle.toLowerCase().includes(expectedTitle.toLowerCase());
  expect(
    titleMatches,
    `[TitleError] Expected page title to contain "${expectedTitle}" (case-insensitive) but got "${actualTitle}". URL: ${this.page.url()}`
  ).toBe(true);
});
