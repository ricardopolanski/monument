import { Page, Locator, expect } from '@playwright/test';

import { Credentials } from '../types/auth.types';
import { BASE_URL } from '../utils/env.utils';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly email: Locator;
  readonly password: Locator;
  readonly signIn: Locator;

  static readonly path = '/auth/login';

  constructor(page: Page) {
    super(page);
    this.email = page.getByTestId('email-input');
    this.password = page.getByTestId('password-input');
    this.signIn = page.getByTestId('sign-in-button');
  }

  async open(): Promise<void> {
    await this.goto(`${BASE_URL}${LoginPage.path}`);
    await expect(this.email).toBeVisible();
  }

  /**
   * Login. If expectNavigation = true, wait for navigation (on success).
   */
  async login(credentials: Credentials, expectNavigation = true): Promise<void> {
    await this.email.fill(credentials.email);
    await this.password.fill(credentials.password);

    if (expectNavigation) {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle' }),
        this.signIn.click(),
      ]);
    } else {
      await this.signIn.click();
    }
  }

  async expectAuthError(partialText: string): Promise<void> {
    const alert = this.page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 5_000 });
    await expect(alert).toContainText(partialText);
  }
}
