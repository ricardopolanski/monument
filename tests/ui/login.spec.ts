import { test, expect } from '@playwright/test';

import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import type { Credentials } from '../types/auth.types';
import { CREDENTIALS } from '../utils/env.utils';

const VALID_EMAIL = CREDENTIALS.admin.email;
const VALID_PASSWORD = CREDENTIALS.admin.password;

test.describe('Positive Scenarios - Login flows - @positive @login', () => {
  test('should login successfully and reach dashboard', async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    // open login page
    await login.open();
    await login.login({ email: VALID_EMAIL, password: VALID_PASSWORD }, { expectNavigation: true });

    // dashboard validations
    await dashboard.expectLoaded();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Negative Scenarios - Login flows - @negative @login', () => {
  test('should show validation/auth error with invalid credentials', async ({ page }) => {
    const login = new LoginPage(page);

    await login.open();

    const badCredentials: Credentials = {
      email: 'bad@user.com',
      password: 'wrong-pass',
    };

    await login.login(badCredentials, { expectNavigation: false });

    await login.expectAuthError('email address');
  });
})
