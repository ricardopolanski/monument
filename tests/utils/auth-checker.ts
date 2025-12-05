import fs from 'fs';
import { chromium } from '@playwright/test';

import { BASE_URL } from './env.utils';
import type { Role } from '../types/auth.types';

export async function isStorageValidForRole(role: Role): Promise<boolean> {
  const path = `storage/${role}.json`;

  if (!fs.existsSync(path)) {
    console.log(`${path} does not exist.`);
    return false;
  }

  const stats = fs.statSync(path);
  if (stats.size < 10) {
    console.log(`${path} appears to be corrupted.`);
    return false;
  }

  // test if session is still valid: try to access /dashboard and check if it doesn't redirect to login
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ storageState: path });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    const url = page.url();

    await context.close();

    if (url.includes('/auth/login') || url.includes('/login')) {
      console.log(`${path} expired or does not allow access to dashboard.`);
      return false;
    }

    console.log(`${path} is valid.`);
    return true;
  } catch (err) {
    console.log(`Error validating ${path}:`, (err as Error).message);
    return false;
  } finally {
    await browser.close();
  }
}
