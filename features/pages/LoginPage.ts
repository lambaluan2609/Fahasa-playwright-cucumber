/**
 * @fileoverview LoginPage — Page Object for the Fahasa login modal.
 *
 * The login modal appears when clicking the "Tài khoản" button in the header.
 * The form uses Vue.js reactive validation: the login button is disabled
 * by default and only becomes enabled after both fields have content.
 * Uses pressSequentially() instead of fill() to properly trigger Vue input events.
 *
 * @module LoginPage
 */
import { Locator, Page } from 'playwright';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // ── Fixed Locators (private) ─────────────────────────────────────
  /** @private CSS selector for the username/email input field */
  private readonly emailInput: string = '#login_username';

  /** @private CSS selector for the password input field */
  private readonly passwordInput: string = '#login_password';

  /** @private CSS selector for the login submit button (disabled until form is valid) */
  private readonly loginButton: string = 'button.fhs-btn-login';

  /** @private CSS selector for the login error popup message */
  private readonly errorMessage: string = '.fhs-popup-msg.fhs-login-msg';

  /**
   * Creates a new LoginPage instance.
   * @param {Page} page - The Playwright Page instance.
   */
  constructor(page: Page) {
    super(page);   
  }

  // ── Dynamic Locators (public getters) ────────────────────────────

  /**
   * Returns a locator for a social login button by its provider name.
   *
   * @param {string} provider - The social provider name (e.g., 'facebook', 'google').
   * @returns {Locator} A Playwright Locator targeting the social login button.
   */
  public locatorSocialLoginByProvider(provider: string): Locator {
    return this.page.locator(
      `//button[contains(@class,'social-login') and contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${provider.toLowerCase()}')]`
    );
  }

  // ── Page Actions ─────────────────────────────────────────────────

  /**
   * Fills login credentials and submits the login form.
   *
   * Uses pressSequentially() with a small delay to trigger Vue.js
   * input events. Waits for the login button to become enabled
   * before clicking.
   *
   * @param {string} email - The username or phone number.
   * @param {string} password - The account password.
   * @returns {Promise<void>}
   * @throws {Error} If login form interaction fails.
   */
  public async login(email: string, password: string): Promise<void> {
    try {
      // Wait for both input fields to be visible
      const emailLocator: Locator = this.page.locator(this.emailInput);
      const passwordLocator: Locator = this.page.locator(this.passwordInput);

      await emailLocator.waitFor({ state: 'visible', timeout: 15_000 });
      await passwordLocator.waitFor({ state: 'visible', timeout: 10_000 });

      // Use pressSequentially to trigger Vue.js reactive validation
      await emailLocator.click();
      await emailLocator.pressSequentially(email, { delay: 30 });

      await passwordLocator.click();
      await passwordLocator.pressSequentially(password, { delay: 30 });

      // Wait for the login button to become enabled (Vue validation passed)
      const loginBtn: Locator = this.page.locator(this.loginButton);
      await loginBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await loginBtn.click();
    } catch (error) {
      throw new Error(
        `[LoginPage] Failed to login with username "${email}". ` +
        `Current URL: ${this.page.url()}. ` +
        `Error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Checks whether a login error message is currently displayed.
   *
   * @returns {Promise<boolean>} True if an error message is visible.
   */
  public async isErrorMessageVisible(): Promise<boolean> {
    try {
      const errorLocator: Locator = this.page.locator(this.errorMessage);
      return await errorLocator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Returns the Locator for the login error popup.
   * Use with Playwright's expect().toBeVisible() for assertion.
   *
   * @returns {Locator} The error popup locator.
   */
  public getErrorPopupLocator(): Locator {
    return this.page.locator(this.errorMessage);
  }

  /**
   * Retrieves the text of the login error message.
   *
   * @returns {Promise<string>} The error message text, or empty string if not found.
   */
  public async getErrorMessageText(): Promise<string> {
    try {
      return await this.getText(this.errorMessage);
    } catch {
      return '';
    }
  }
}
