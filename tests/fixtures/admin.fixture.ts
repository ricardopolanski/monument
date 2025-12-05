import { test as base, BrowserContext, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import { LoginPage } from '../pages/login.page';
import { CREDENTIALS, BASE_URL } from '../utils/env.utils';

type AdminFixtures = {
  adminPage: Page;
  adminContext: BrowserContext;
};

const STORAGE_PATH = path.resolve(process.cwd(), 'storage', 'admin.json');

async function createFreshAdminContext(browser: any): Promise<BrowserContext> {
  // create context with baseURL
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  const login = new LoginPage(page);
  await login.open();
  await login.login(
    {
      email: CREDENTIALS.admin.email,
      password: CREDENTIALS.admin.password,
    },
    true,
  );

  // ensure login was successful
  await page.waitForURL(/\/dashboard/);

  // save storage
  fs.mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });
  await context.storageState({ path: STORAGE_PATH });

  return context;
}

export const test = base.extend<AdminFixtures>({
  adminContext: async ({ browser }, use) => {
    let context: BrowserContext | null = null;

    // 1) try to use existing storage, if there is one
    if (fs.existsSync(STORAGE_PATH)) {
      try {
        context = await browser.newContext({
          storageState: STORAGE_PATH,
          baseURL: BASE_URL,
        });

        const page = await context.newPage();
        await page.goto('/dashboard');

        // validate if still logged in:
        // se tiver redirecionado pra /login ou algo assim, considera inválido
        const currentUrl = page.url();
        const isLoggedIn = currentUrl.includes('/dashboard');

        if (!isLoggedIn) {
          await context.close();
          context = null; // force recreation
        }
      } catch (err) {
        // corrupted or invalid file → we will recreate
        if (context) {
          await context.close();
        }
        context = null;
      }
    }

    // 2) if there is no storage or it was invalid, create a new one
    if (!context) {
      context = await createFreshAdminContext(browser);
    }

    await use(context);
    await context.close();
  },

  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
