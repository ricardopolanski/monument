import fs from 'fs';
import { chromium } from '@playwright/test';

import { BASE_URL } from './env.utils';
import type { Role } from '../types/auth.types';

export async function isStorageValidForRole(role: Role): Promise<boolean> {
  const path = `storage/${role}.json`;

  if (!fs.existsSync(path)) {
    console.log(`${path} não existe.`);
    return false;
  }

  const stats = fs.statSync(path);
  if (stats.size < 10) {
    console.log(`${path} parece corrompido.`);
    return false;
  }

  // testa se sessão ainda é válida: tenta acessar /dashboard e ver se não redireciona para login
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ storageState: path });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    const url = page.url();

    await context.close();

    if (url.includes('/auth/login') || url.includes('/login')) {
      console.log(`${path} expirou ou não permite acesso ao dashboard.`);
      return false;
    }

    console.log(`${path} válido.`);
    return true;
  } catch (err) {
    console.log(`Erro ao validar ${path}:`, (err as Error).message);
    return false;
  } finally {
    await browser.close();
  }
}
