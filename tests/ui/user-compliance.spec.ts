// tests/ui/alba-user-login-and-facility.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import { AuthClient } from '../api/clients/auth.client';
import { UserAccountClient } from '../api/clients/user.client';
import { createMailosaurUser } from '../helpers/create-mailosaur-user.helper';
import { fetchMailosaurMessage, extractTemporaryPassword } from '../helpers/mailosaur.helper';
import { LoginPage } from '../pages/login.page';
import { FacilitiesPage } from '../pages/facilities.page';

const EXTENDED_TIME_OUT = Number(process.env.EXTENDED_TIME_OUT ?? 60_000);
const API_URL = process.env.API_URL ?? 'https://api-ext.stg.monument.io';

test.describe('Alba-only user full flow (create → activate → UI verify)', () => {
  test.only('create user via API, activate, login UI and verify only Alba is accessible', async ({ request, page, browser }) => {

    const { mailAddress } = await createMailosaurUser();

    const auth = new AuthClient(request);
    const usersClient = new UserAccountClient(request);

    const adminLoginRes = await auth.login();
    expect(adminLoginRes.status).toBe(200);
    const adminToken = adminLoginRes.json.tokens?.AccessToken;
    if (!adminToken) throw new Error('Admin login did not return AccessToken');

    const { faker } = await import('@faker-js/faker');
    const newUser = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      jobTitle: 'QA - Alba Only',
      email: mailAddress,
      hasAllFacilityAccess: false,
      facilityOrgIds: ['f4bb96e1-8204-11f0-973a-89f348dc1def'], // Alba
      rootRoleId: '00000000-0000-0000-0000-000000000000',
    };

    const createRes = await usersClient.createUser(adminToken, newUser);
    expect(createRes.status).toBe(201);

    const msg = await fetchMailosaurMessage({
      sentTo: mailAddress,
      timeoutMs: EXTENDED_TIME_OUT,
    });

    const temporaryPassword = extractTemporaryPassword(msg);
    if (!temporaryPassword) throw new Error('Temporary password not found in email');

    const loginTempRes = await request.post(`${API_URL}/auth/login`, {
      data: { username: mailAddress, password: temporaryPassword },
    });

    if (loginTempRes.status() < 200 || loginTempRes.status() >= 300) {
      const raw = await loginTempRes.text().catch(() => '<no-body>');
      throw new Error(`Temp login failed: ${loginTempRes.status()} - ${raw}`);
    }
    const loginTempJson = await loginTempRes.json();

    // path to save final credentials (optional)
    const outPath = path.resolve(process.cwd(), 'tests', '.created_user.json');

    // If Monument asks update_password -> call /auth/resetPassword
    if (loginTempJson?.next === 'update_password' && loginTempJson?.authSession) {
      const finalPassword =
        process.env.TEST_NEW_PASSWORD ??
        `Pwd@${Math.random().toString(36).slice(2)}X!`.slice(0, 14);

      const resetRes = await request.post(`${API_URL}/auth/resetPassword`, {
        data: {
          username: mailAddress,
          authSession: loginTempJson.authSession,
          newPassword: finalPassword,
          additionalAttributes: {
            given_name: newUser.firstName,
            family_name: newUser.lastName,
          },
        },
      });

      if (resetRes.status() < 200 || resetRes.status() >= 300) {
        const raw = await resetRes.text().catch(() => '<no-body>');
        throw new Error(`resetPassword failed: ${resetRes.status()} - ${raw}`);
      }

      const resetJson = await resetRes.json();
      const tokens = resetJson.tokens ?? resetJson;
      if (!tokens?.AccessToken && !tokens?.access_token && !tokens?.IdToken && !tokens?.id_token) {
        throw new Error('resetPassword did not return tokens - activation may have failed');
      }

      const outData = {
        email: mailAddress,
        password: finalPassword,
        facilityOrgIds: newUser.facilityOrgIds,
        activatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(outPath, JSON.stringify(outData, null, 2));
    } else if (loginTempJson?.tokens?.AccessToken || loginTempJson?.tokens?.IdToken || loginTempJson?.access_token) {
      const outData = {
        email: mailAddress,
        password: temporaryPassword,
        facilityOrgIds: newUser.facilityOrgIds,
        activatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(outPath, JSON.stringify(outData, null, 2));
    } else {
      throw new Error(`Unexpected login flow response: ${JSON.stringify(loginTempJson)}`);
    }

    const created = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const userEmail = created.email;
    const userPassword = created.password;

    const loginPage = new LoginPage(page);
    const facilities = new FacilitiesPage(page);

    await loginPage.open();
    // pass options to accept terms automatically
    await loginPage.login({ email: userEmail, password: userPassword }, { acceptTermsAndConditions: true });

    // Wait for All Facilities button as indicator of successful login
    const allFacilitiesBtn = page.getByRole('button', { name: 'All Facilities' });
    await expect(allFacilitiesBtn).toBeVisible({ timeout: 10_000 });

    // open facilities selector and assert only Alba
    await facilities.open();
    await facilities.expectOnly('Alba');

    // verify navigator shows Alba
    const navigator = page.getByTestId('navigator-container');
    await expect(navigator).toBeVisible({ timeout: 5_000 });
    await expect(navigator).toContainText(/Alba/i);

    // extra sanity checks
    const facilitiesGrid = page.getByTestId('facilities-grid');
    await expect(facilitiesGrid).toBeVisible();
    const albaItem = facilitiesGrid.locator('li').filter({ hasText: /Alba/i }).first();
    await expect(albaItem).toBeVisible();

    const facilityAddress = page.locator('text=6384 Hwy 69').first();
    await expect(facilityAddress).toBeVisible({ timeout: 10_000 });
    await expect(facilityAddress).toContainText(/6384 Hwy 69, Alba, TX/i);

    const forbidden = ['Clayton', 'Dallas', 'Lufkin', 'Austin'];
    for (const f of forbidden) {
      await expect(page.locator(`text=${f}`)).not.toBeVisible({ timeout: 200 });
    }
  });
});
