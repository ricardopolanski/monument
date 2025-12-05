// playwright.config.ts
import * as dotenv from 'dotenv';
dotenv.config(); // garante que o .env da raiz foi carregado

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 45_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    baseURL: process.env.BASE_URL ?? 'https://monument.stg.monument.io',
  },
});
