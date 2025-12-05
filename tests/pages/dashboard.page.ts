import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  async open() {
    await this.goto('/dashboard');
    await this.expectLoaded();
  }

  async expectLoaded(timeout = 45_000) {
    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => null);

    await this.page.waitForSelector('#root', { state: 'visible', timeout });
  }

  async goToUsersAndPermissions() {
    await this.page.getByRole('link', { name: 'Settings' }).click();
    await this.page.getByRole('link', { name: 'Users & Permissions' }).click();
  }
}
