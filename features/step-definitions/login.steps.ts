/**
 * @fileoverview Login step definitions for the Fahasa login feature.
 *
 * Handles all login-related steps including clicking the account button,
 * logging in with valid/invalid credentials, and verifying login outcomes.
 *
 * @module loginSteps
 */
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';

/**
 * Step: Clicks the account/login button on the homepage header.
 */
When('the user clicks the account button', async function (this: CustomWorld): Promise<void> {
  if (!this.page) throw new Error('Page not initialized');

  const homePage: HomePage = new HomePage(this.page);
  await homePage.clickAccountButton();
});

/**
 * Step: Logs in using the valid credentials from the environment config.
 */
When('the user logs in with valid credentials', async function (this: CustomWorld): Promise<void> {
  if (!this.page) throw new Error('Page not initialized');

  const loginPage: LoginPage = new LoginPage(this.page);
  await loginPage.login(this.config.FAHASA_USERNAME, this.config.FAHASA_PASSWORD);
});

/**
 * Step: Logs in using specific username and password provided in the step.
 * Used for data-driven Scenario Outline and invalid login tests.
 */
When(
  'the user logs in with username {string} and password {string}',
  async function (this: CustomWorld, username: string, password: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    const loginPage: LoginPage = new LoginPage(this.page);
    await loginPage.login(username, password);
  }
);

/**
 * Step: Asserts that the user has been redirected to the account page after login.
 */
Then('the user should be redirected to the account page', async function (this: CustomWorld): Promise<void> {
  if (!this.page) throw new Error('Page not initialized');

  await this.page.waitForURL(/customer\/account/, { timeout: 30_000 });

  const currentUrl: string = this.page.url();
  expect(
    currentUrl,
    `[NavigationError] Expected to be redirected to account page but current URL is "${currentUrl}"`
  ).toMatch(/customer\/account/);
});

/**
 * Step: Asserts that a login error message is displayed.
 * Waits a short period for the error to appear on the page.
 */
Then('the login should fail with an error message', async function (this: CustomWorld): Promise<void> {
  if (!this.page) throw new Error('Page not initialized');

  // Verify the error popup is visible via LoginPage
  const loginPage: LoginPage = new LoginPage(this.page);
  await expect(
    loginPage.getErrorPopupLocator(),
    '[LoginError] Expected login error popup to be visible after failed login attempt'
  ).toBeVisible({ timeout: 10_000 });
});

/**
 * Step: Checks the login result against an expected outcome (success/failure).
 * Used with the Scenario Outline data-driven approach.
 */
Then(
  'the login result should be {string}',
  async function (this: CustomWorld, expectedResult: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    if (expectedResult === 'success') {
      // Wait for redirect to account page
      await this.page.waitForURL(/customer\/account/, { timeout: 30_000 });

      const currentUrl: string = this.page.url();
      expect(
        currentUrl,
        `[LoginResult] Expected login to succeed and redirect to account page, but current URL is "${currentUrl}"`
      ).toMatch(/customer\/account/);
    } else {
      // Verify the error popup is visible via LoginPage
      const loginPage: LoginPage = new LoginPage(this.page);
      await expect(
        loginPage.getErrorPopupLocator(),
        '[LoginResult] Expected login error popup to be visible after failed login'
      ).toBeVisible({ timeout: 10_000 });
    }
  }
);
