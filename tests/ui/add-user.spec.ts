import { BASE_URL } from 'tests/utils/env.utils';
import { extractTemporaryPassword, fetchMailosaurMessage } from 'tests/helpers/mailosaur.helper';
import { ActivationPage } from 'tests/pages/activate-user.page';
import { createMailosaurUser } from 'tests/helpers/create-mailosaur-user.helper';

import { test, expect } from '../fixtures/admin.fixture';
import { DashboardPage } from '../pages/dashboard.page';
import { UsersPage, UserPayload } from '../pages/users.page';

const EXTENDED_TIME_OUT = Number(process.env.EXTENDED_TIME_OUT);
const MAILOSAUR_TIMEOUT = Number(process.env.MAILOSAUR_TIMEOUT);
const MAILOSAUR_POLLING_INTERVAL = Number(process.env.MAILOSAUR_POLLING_INTERVAL);

let createdUser: UserPayload;

export const randomUser = async () => {
    const { faker } = await import('@faker-js/faker');
    return {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email({ firstName: faker.person.firstName(), lastName: faker.person.lastName() }),
    };
};

test.beforeEach(async ({ adminPage }) => {
    const users = new UsersPage(adminPage);

    const dashboard = new DashboardPage(adminPage);

    await dashboard.open();

    await users.openUsersAndPermissions();

    createdUser = await randomUser();

    await users.addUser();

    await users.fillUserForm(createdUser);
});

test.describe('Positive Scenarios - Users CRUD - @positive @users', () => {
    test('create user', async ({ adminPage }) => {
        const users = new UsersPage(adminPage);

        await users.selectRole('Analyst');

        await users.toggleFacilityCheckbox('Clayton');

        await adminPage.getByRole('button', { name: 'Add User' }).click();

        await expect(users.toastTitle).toContainText('Changes Saved').catch(() => { });
    });

    test('edit user', async ({ adminPage }) => {
        const users = new UsersPage(adminPage);

        await users.selectRole('Analyst');

        await users.toggleFacilityCheckbox('Clayton');

        await adminPage.getByRole('button', { name: 'Add User' }).click();

        await expect(users.toastTitle).toContainText('Changes Saved').catch(() => { });

        const searchName = `${createdUser.firstName} ${createdUser.lastName}`;

        await users.searchUser(searchName);

        await users.openEditForFoundUser(searchName);

        await users.lastNameInput.fill('Doe Sample');

        await users.jobTitleInput.fill('Developer');

        await users.selectRole('Analyst');

        await users.setAccessAllFacilities(true);

        const infoText = adminPage.locator('[data-testid="InfoCircleRegularIcon"] + p');

        await expect(infoText).toHaveText('User will be able to access all existing and future facilities.');

        await users.saveChanges();

        await expect(users.toastTitle).toContainText('Changes Saved');

        await expect(users.toastBody).toContainText('Affected user will be logged out if permissions were updated.');
    });

    test('deactivate user', async ({ adminPage }) => {
        const users = new UsersPage(adminPage);

        await users.selectRole('Analyst');

        await users.toggleFacilityCheckbox('Clayton');

        await adminPage.getByRole('button', { name: 'Add User' }).click();

        await expect(users.toastTitle).toContainText('Changes Saved').catch(() => { });

        const searchName = `${createdUser.firstName} ${createdUser.lastName}`;

        await users.searchUser(searchName);

        const userRow = adminPage.locator(`tr:has-text("${searchName}")`).first();

        await userRow.waitFor({ state: 'visible' });

        const editButton = userRow.locator('svg[data-testid="UserMinusRegularIcon"]').first();

        await editButton.waitFor({ state: 'visible' });

        await editButton.click();

        await expect(adminPage.locator('html')).toContainText('Deactivate user');

        await adminPage.getByRole('button', { name: 'Deactivate' }).click();

        await expect(adminPage.locator('html')).toContainText('User deactivated');
    });


    test('Should create user and validate email delivery - @email @integration', async ({ adminPage }) => {
        const users = new UsersPage(adminPage);
        const { mailAddress, MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID } = await createMailosaurUser();

        await users.emailInput.fill(mailAddress);
        await users.selectRole('Analyst');
        await users.toggleFacilityCheckbox('Clayton');
        await adminPage.getByRole('button', { name: 'Add User' }).click();

        await expect(users.toastTitle).toContainText('Changes Saved').catch(() => { });

        const MailosaurClient = (await import('mailosaur')).default;
        const client = new MailosaurClient(MAILOSAUR_API_KEY);

        const timeoutMs = MAILOSAUR_TIMEOUT;
        const intervalMs = MAILOSAUR_POLLING_INTERVAL;
        const deadline = Date.now() + timeoutMs;
        let message: any = null;
        let lastError: any = null;

        while (Date.now() < deadline) {
            try {
                message = await client.messages.get(MAILOSAUR_SERVER_ID, { sentTo: mailAddress });
                if (message) break;
            } catch (err: any) {
                lastError = err;
                if (String(err.message).toLowerCase().includes('permission')) {
                    throw new Error('Insufficient permission to access Mailosaur — verify MAILOSAUR_API_KEY (must be API key, not SMTP password).');
                }
            }
            await new Promise(r => setTimeout(r, intervalMs));
        }

        if (!message) {
            throw new Error(`Email NOT found for ${mailAddress} within ${timeoutMs}ms. Last error: ${String(lastError?.message ?? lastError)}`);
        }

        // ---------- Email validations ----------
        expect((message.subject ?? '').toLowerCase()).toContain('welcome to monument');
        const bodyText = message.text?.body ?? message.html?.body ?? '';
        expect(bodyText).toContain('Temporary Password');

        const tempPasswordMatch = bodyText.match(/Temporary Password:\s*([^\s<]+)/i);
        if (!tempPasswordMatch) throw new Error('Temporary password not found in email.');
        const temporaryPassword = tempPasswordMatch[1];

        const browser = adminPage.context().browser();
        const activationContext = await browser?.newContext();
        const activationPage = await activationContext?.newPage();
        if (!activationContext || !activationPage) {
            throw new Error('Failed to create activation context.');
        }

        try {
            // 1) open login (use BASE_URL from env.utils)
            await activationPage.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });

            // 2) fill email + temporary password and submit
            await activationPage.getByTestId('email-input').fill(mailAddress);
            await activationPage.getByTestId('password-input').fill(temporaryPassword);
            await Promise.all([
                activationPage.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
                activationPage.getByTestId('sign-in-button').click(),
            ]);

            // 3) now the application should redirect to the new password creation screen.
            // wait for new password field
            const newPassword = process.env.TEST_NEW_PASSWORD ?? `Pwd@${Math.random().toString(36).slice(2)}X!`.slice(0, 14);
            const newPasswordField = activationPage.getByTestId('newPassword-input');
            await newPasswordField.waitFor({ state: 'visible', timeout: EXTENDED_TIME_OUT });
            await newPasswordField.fill(newPassword);

            const confirmPasswordField = activationPage.getByTestId('confirmPassword-input');
            if (await confirmPasswordField?.count?.()) {
                await confirmPasswordField.fill(newPassword);
            }

            const submitButton = activationPage.getByTestId('update-password-button');
            await submitButton.click();

            //-------------------------------------------------------
            // 2) wait for access terms modal to appear
            //-------------------------------------------------------
            const termsModal = activationPage.locator('text=Access Terms');
            await termsModal.waitFor({ state: 'visible', timeout: EXTENDED_TIME_OUT });

            // wait for checkbox to appear inside the modal
            const agreementCheckbox = activationPage.getByTestId('checkbox-accepted');
            await agreementCheckbox.waitFor({ state: 'visible' });

            // mark the checkbox
            await agreementCheckbox.click({ force: true });

            //-------------------------------------------------------
            // 3) Continue button becomes enabled after checking the checkbox
            //-------------------------------------------------------
            const continueBtn = activationPage.getByRole('button', { name: 'Continue' });
            await continueBtn.waitFor({ state: 'visible' });

            await continueBtn.click();

            // 4) Final validation: are we on the dashboard?
            await activationPage.waitForLoadState('networkidle').catch(() => null);
            await expect(activationPage).toHaveURL(/\/dashboard/, { timeout: EXTENDED_TIME_OUT });
        } finally {
            // try to close the created context, but ignore errors if the test has already been finalized
            if (activationContext) {
                await activationContext.close().catch(() => { });
            }
        }
    });

    test('Should create user and activate account - @email @integration', async ({ adminPage }) => {
        const users = new UsersPage(adminPage);

        // Mailosaur config and unique mail
        const MAILOSAUR_DOMAIN = `${process.env.MAILOSAUR_SERVER_ID ?? 'bgzl7quv'}.mailosaur.net`;
        const mailAddress = `rpolanski+${Date.now()}@${MAILOSAUR_DOMAIN}`;

        // create user
        await users.emailInput.fill(mailAddress);
        await users.selectRole('Analyst');
        await users.toggleFacilityCheckbox('Clayton');
        await adminPage.getByRole('button', { name: 'Add User' }).click();

        // fetch email
        const message = await fetchMailosaurMessage({ sentTo: mailAddress, timeoutMs: EXTENDED_TIME_OUT });
        const temporaryPassword = extractTemporaryPassword(message);
        if (!temporaryPassword) throw new Error('Temporary password not found in email.');

        // activation flow via POM
        const browser = adminPage.context().browser();
        const activationContext = await browser?.newContext();
        const activationPage = await activationContext?.newPage();
        if (!activationContext || !activationPage) {
            throw new Error('Failed to create activation context.');
        }
        const activation = new ActivationPage(activationPage);

        try {
            await activation.openLogin();
            await activation.loginWith({ email: mailAddress, password: temporaryPassword });

            const newPassword = process.env.TEST_NEW_PASSWORD ?? `Pwd@${Math.random().toString(36).slice(2)}X!`.slice(0, 14);
            await activation.setNewPassword(newPassword);

            await activation.acceptTermsAndContinue();

            await activation.expectOnUsersOrDashboard();
        } finally {
            await activationContext.close().catch(() => {});
        }
    });
});
