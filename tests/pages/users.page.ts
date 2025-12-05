// tests/pages/users.page.ts
import { expect, Locator, Page } from '@playwright/test';

import { UserPayload } from 'tests/types/users';

export class UsersPage {
    readonly page: Page;
    readonly settingsLink: Locator;
    readonly usersAndPermissionsLink: Locator;
    readonly addUserButton: Locator;
    readonly saveChangesButton: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly emailInput: Locator;
    readonly jobTitleInput: Locator;
    readonly roleSelectButton: Locator;
    readonly listbox: Locator;
    readonly searchBox: Locator;
    readonly tableRows: Locator;
    readonly accessAllFacilitiesCheckbox: Locator;
    readonly infoIconContainers: Locator;
    readonly toastContainer: Locator;
    readonly toastTitle: Locator;
    readonly toastBody: Locator;

    constructor(page: Page) {
        this.page = page;
        this.settingsLink = page.getByRole('link', { name: 'Settings' });
        this.usersAndPermissionsLink = page.getByRole('link', { name: 'Users & Permissions' });
        this.addUserButton = page.getByRole('button', { name: 'Add User' });
        this.saveChangesButton = page.getByRole('button', { name: 'Save Changes' });
        this.firstNameInput = page.getByTestId('firstName-input');
        this.lastNameInput = page.getByTestId('lastName-input');
        this.emailInput = page.getByTestId('email-input');
        this.jobTitleInput = page.getByTestId('jobTitle-input');
        this.roleSelectButton = page.getByRole('button', { name: /Role/ });
        this.listbox = page.locator('[role="listbox"]');
        this.searchBox = page.getByRole('textbox', { name: 'Search...' });
        this.tableRows = page.locator('tbody tr');
        this.accessAllFacilitiesCheckbox = page.getByRole('checkbox', { name: 'Access All Facilities' });
        this.infoIconContainers = page.locator('div:has([data-testid="InfoCircleRegularIcon"])');
        this.toastContainer = page.locator('.Toastify__toast-container .Toastify__toast');
        this.toastTitle = this.toastContainer.locator('.MuiStack-root span').first();
        this.toastBody = this.toastContainer.locator('.MuiStack-root p').first();
    }

    async openUsersAndPermissions() {
        await this.settingsLink.click();
        await this.usersAndPermissionsLink.click();
        await this.page.locator('#data-table-container-facilitySelector, table').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => { });
        await this.page.waitForLoadState('networkidle');
    }

    async addUser() {
        await this.addUserButton.click();
        await this.page.waitForSelector('[data-testid="firstName-input"]', { state: 'visible', timeout: 10_000 });
    }

    async fillUserForm(user: UserPayload) {
        await this.firstNameInput.fill(user.firstName);
        await this.lastNameInput.fill(user.lastName);
        await this.emailInput.fill(user.email);
        await this.jobTitleInput.fill(user.jobTitle ?? '');
    }

    async openRoleOptions() {
        await this.roleSelectButton.click();
        await this.listbox.waitFor({ state: 'visible', timeout: 5_000 });
    }

    async selectRole(roleName: string) {
        await this.openRoleOptions();
        await this.page.getByRole('option', { name: roleName }).click();
    }

    rowByText(text: string): Locator {
        return this.page.locator(`tr:has-text("${text}")`);
    }

    rowByFacility(facilityText: string) {
        return this.page.locator(`tr:has-text("${facilityText}")`);
    }

    rowCheckboxByText(text: string): Locator {
        const row = this.rowByText(text).first();
        return row.locator('input[type="checkbox"]').first();
    }

    async toggleFacilityCheckbox(facilityText: string) {
        const row = this.rowByFacility(facilityText);
        const checkbox = row.locator('input[type="checkbox"]');
        await checkbox.click();
        return checkbox;
    }

    async setAccessAllFacilities(enabled: boolean) {
        const checkbox = this.accessAllFacilitiesCheckbox;
        await expect(checkbox).toBeVisible();
        const isChecked = await checkbox.isChecked().catch(() => false);
        if (enabled && !isChecked) {
            await checkbox.check();
        } else if (!enabled && isChecked) {
            await checkbox.uncheck();
        }
    }

    async searchUser(fullName: string, options?: { waitForResultTimeout?: number }) {
        const timeout = options?.waitForResultTimeout ?? 30_000;

        let box = this.searchBox;
        if (!(await box.count())) {
            box = this.page.locator('input[placeholder="Search..."], input[name="search"], input[type="search"]').first();
        }

        await box.waitFor({ state: 'visible', timeout: 10_000 });
        await box.click({ force: true });
        await box.type(fullName, { delay: 50 });
        await box.press('Enter');

        const row = this.page.locator(`tr:has-text("${fullName}")`).first();
        try {
            await row.waitFor({ state: 'visible', timeout });
            return true;
        } catch (e) {
            return false;
        }
    }
    async openEditForFoundUser(fullName: string): Promise<void> {
        const userRow = this.page.locator(`tr:has-text("${fullName}")`).first();
        await userRow.waitFor({ state: 'visible', timeout: 30_000 });

        const editButton = userRow.locator('svg[data-testid="EditRegularIcon"]').first();
        await editButton.waitFor({ state: 'visible', timeout: 10_000 });
        await editButton.click();
        await this.page.waitForSelector('[data-testid="firstName-input"]', { state: 'visible', timeout: 60_000 });
    }

    async saveChanges() {
        await expect(this.saveChangesButton).toBeVisible({ timeout: 5_000 });
        await this.saveChangesButton.click();
    }

    async toastContains(title: string, body?: string) {
        await expect(this.toastTitle).toContainText(title, { timeout: 10_000 });
        if (body) await expect(this.toastBody).toContainText(body, { timeout: 10_000 });
    }

    async openDeactivateDialogAndConfirm(fullName?: string) {
        if (fullName) {
            await this.searchUser(fullName);
            await expect(this.rowByText(fullName).first()).toBeVisible({ timeout: 5_000 });
        }

        await this.page.getByLabel('Deactivate').getByRole('button').click();

        await this.page.getByText(/Are you sure you want to permanently deactivate user/).waitFor({ state: 'visible', timeout: 10_000 });

        await this.page.getByRole('button', { name: 'Deactivate' }).click();
    }
}
export { UserPayload };

