import { test, expect } from '../fixtures/admin.fixture';
import { DashboardPage } from '../pages/dashboard.page';

test.describe.skip('Dashboard as admin (via storageState) - @positive @dashboard', () => {
  test('should open dashboard already logged in', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);

    await dashboard.expectLoaded();

    await expect(adminPage).toHaveURL(/\/dashboard/);
  });
});
