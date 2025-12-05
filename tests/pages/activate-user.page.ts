import { Page } from '@playwright/test';

import { BASE_URL } from 'tests/utils/env.utils';

import { Credentials } from '../types/auth.types';

const EXTENDED_TIME_OUT = Number(process.env.EXTENDED_TIME_OUT) || 20_000;

export class ActivationPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async openLogin() {
    await this.page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
  }

  async loginWith(credentials: Credentials) {
    await this.page.getByTestId('email-input').fill(credentials.email);
    await this.page.getByTestId('password-input').fill(credentials.password);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
      this.page.getByTestId('sign-in-button').click(),
    ]);
  }

  async setNewPassword(newPassword: string) {
    const newPasswordField = this.page.getByTestId('newPassword-input');
    await newPasswordField.waitFor({ state: 'visible', timeout: EXTENDED_TIME_OUT });
    await newPasswordField.fill(newPassword);

    const confirm = this.page.getByTestId('confirmPassword-input')
    if (confirm && (await confirm.count().catch(() => 0)) > 0) {
      await confirm.fill(newPassword);
    }

    const submit = this.page.getByTestId('update-password-button');
    await submit.waitFor({ state: 'visible' });
    await submit.click();
  }

  async acceptTermsAndContinue() {
    // wait for modal
    const termsModal = this.page.locator('text=Access Terms');
    await termsModal.waitFor({ state: 'visible' });

    // try to mark checkbox wrapper (more reliable)
    const checkbox = this.page.getByTestId('checkbox-accepted');
    if (checkbox && (await checkbox.count().catch(() => 0)) > 0) {
      await checkbox.waitFor({ state: 'visible' });
      await checkbox.click({ force: true });
    } else {
      // fallback for icon
      const icon = this.page.getByTestId('CheckBoxOutlineBlankIcon');
      if (icon && (await icon.count().catch(() => 0)) > 0) {
        await icon.click({ force: true }).catch(() => null);
      }
    }

    // click Continue and wait for initial navigation
    const continueBtn = this.page.getByRole('button', { name: 'Continue' });
    await continueBtn.waitFor({ state: 'visible' });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
      continueBtn.click({ force: true }),
    ]);

    // wait for final UI indicators: Users & Permissions | table | Dashboard
    const checks = [
      'text=Users & Permissions',
      '#data-table-container-facilitySelector, table',
      'text=Dashboard',
    ];

    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      try {
        for (const sel of checks) {
          const count = await this.page.locator(sel).count().catch(() => 0);
          if (count > 0) return;
        }
        const url = this.page.url().toLowerCase();
        if (url.includes('/dashboard') || url.includes('/users') || url.includes('/settings')) return;
      } catch {
        // ignore transient errors
      }
      await new Promise(r => setTimeout(r, 500));
    }

    const url = this.page.url();
    const snippet = (await this.page.content().catch(() => '')).slice(0, 1000);
    throw new Error(`Final UI not detected after accepting terms. URL: ${url}\nSNIPPET: ${snippet}`);
  }

  async expectOnUsersOrDashboard() {
    if ((await this.page.locator('text=Users & Permissions').count().catch(() => 0)) > 0) return;
    if ((await this.page.locator('#data-table-container-facilitySelector, table').count().catch(() => 0)) > 0) return;

    const url = this.page.url().toLowerCase();
    if (url.includes('/dashboard') || (await this.page.locator('text=Dashboard').count().catch(() => 0)) > 0) return;

    throw new Error(`not on Users or Dashboard. URL: ${this.page.url()}`);
  }
}
