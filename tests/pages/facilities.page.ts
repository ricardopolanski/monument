// tests/pages/facilities.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class FacilitiesPage {
  readonly page: Page;
  readonly allFacilitiesButton: Locator;
  readonly grid: Locator;
  readonly applyButton: Locator;
  readonly clearAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.allFacilitiesButton = page.getByRole('button', { name: 'All Facilities' });
    this.grid = page.getByTestId('facilities-grid');
    this.applyButton = page.getByRole('button', { name: /Apply \(/i }).first();
    this.clearAllButton = page.getByRole('button', { name: 'Clear All' }).first();
  }

  /** Abre o modal / painel de facilities */
  async open(): Promise<void> {
    await expect(this.allFacilitiesButton).toBeVisible();
    await this.allFacilitiesButton.click();
    await expect(this.grid).toBeVisible();
  }

  /** Retorna locator para os itens (<li>) dentro do grid */
  items(): Locator {
    return this.grid.locator('li');
  }

  /** Conta quantos facilities estão exibidos */
  async count(): Promise<number> {
    return await this.items().count();
  }

  /** Asserta que somente um facility existe e seu nome bate com o esperado */
  async expectOnly(name: string): Promise<void> {
    const items = this.items();
    await expect(items).toHaveCount(1);
    const facilityName = items.first().getByTestId('facility-name');
    await expect(facilityName).toHaveText(name);
  }

  /** Asserta que ao menos um facility cujo texto contenha 'name' está presente */
  async expectContains(name: string): Promise<void> {
    const items = this.items();
    await expect(items).toContainText(new RegExp(name, 'i'));
  }

   /** Clica no botão Only (se esse botão existir dentro do item) */
  async only(name: string): Promise<void> {
    const items = this.items();
    const target = items.filter({ hasText: new RegExp(name, 'i') }).first();
    await expect(target).toBeVisible();
    const onlyBtn = target.locator('button', { hasText: 'Only' });
    await expect(onlyBtn).toBeVisible();
    await onlyBtn.click();
  }

  /** Limpa seleção via Clear All (caso exista) */
  async clearAll(): Promise<void> {
    if (await this.clearAllButton.isVisible().catch(() => false)) {
      await this.clearAllButton.click();
    }
  }
}
