import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path, { waitUntil: 'networkidle' });
  }

  async expectUrlContains(fragment: string) {
    await expect(this.page).toHaveURL(new RegExp(fragment));
  }
}
