// tests/pages/login.page.ts
import { Page, Locator, expect } from '@playwright/test';

import { Credentials, LoginOptions } from '../types/auth.types';
import { BASE_URL } from '../utils/env.utils';
import { BasePage } from './base.page';
import { ActivationPage } from './activate-user.page'; // ajuste se o arquivo for ./activate-user.page

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

  async login(
    credentials: Credentials,
    options?: Partial<LoginOptions>
  ): Promise<void> {
    const opts: LoginOptions = {
      expectNavigation: true,
      acceptTermsAndConditions: false,
      ...options,
    };

    await this.email.fill(credentials.email);
    await this.password.fill(credentials.password);

    if (opts.expectNavigation) {
      await this.signIn.click();
    } else {
      await Promise.all([this.page.waitForNavigation({ waitUntil: 'networkidle' }), this.signIn.click()]);
    }

    if (opts.acceptTermsAndConditions) {
      try {
        const activation = new ActivationPage(this.page);
        await activation.acceptTermsAndContinue();
        await this.page.waitForLoadState('networkidle').catch(() => {});
      } catch (err) {
        console.warn('acceptTermsAndContinue: warning -', (err as Error).message ?? err);
      }
    }
  }

  async expectAuthError(partialText: string): Promise<void> {
    const alert = this.page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 5_000 });
    await expect(alert).toContainText(partialText);
  }
}
