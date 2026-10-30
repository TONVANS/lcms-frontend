import path from 'node:path';
import { expect, test } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

test.describe('support', () => {
  test('non-admin sees contact cards and creates a ticket with an image, cannot see admin controls', async ({ page }) => {
    await loginAs(page, 'gc.user');
    await page.goto('/support');

    // Contact cards are visible
    await expect(page.getByRole('heading', { level: 2, name: lo.support.contactsHeading })).toBeVisible();
    await expect(page.getByRole('link', { name: /\+856/ }).first()).toBeVisible();

    // Non-admin controls are absent
    await expect(page.getByRole('button', { name: lo.support.addContact })).not.toBeVisible();

    // Create a support ticket with an image attachment
    await page.getByRole('button', { name: lo.support.report }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const subject = `E2E Bug Report ${Date.now()}`;
    await dialog.getByLabel(lo.support.subject).fill(subject);
    await dialog.getByLabel(lo.support.descriptionLabel).fill('Detailed error description for e2e test.');

    const fixturePath = path.resolve(__dirname, 'fixtures/sample.png');
    await dialog.getByLabel(lo.dropzone.prompt).setInputFiles(fixturePath);
    await expect(dialog.getByText('sample.png')).toBeVisible();

    await dialog.getByRole('button', { name: lo.support.submit }).click();
    await expect(dialog).not.toBeVisible();

    // Ticket appears in the list
    await expect(page.getByText(subject)).toBeVisible();
  });

  test('admin filters tickets and updates ticket status', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/support');

    // Admin sees admin controls
    await expect(page.getByRole('button', { name: lo.support.addContact })).toBeVisible();

    // Filter by status chips
    const closedFilter = page.getByRole('button', { name: lo.support.statuses.CLOSED });
    await closedFilter.click();
    await expect(page).toHaveURL(/status=CLOSED/);

    const allFilter = page.getByRole('button', { name: lo.support.all });
    await allFilter.click();

    // Update ticket status
    const updateButtons = page.getByRole('button', { name: new RegExp(lo.support.updateTicket) });
    await expect(updateButtons.first()).toBeVisible();
    await updateButtons.first().click();

    const updateDialog = page.getByRole('dialog');
    await expect(updateDialog).toBeVisible();

    await updateDialog.getByLabel(lo.support.colStatus).selectOption('RESOLVED');
    await updateDialog.getByLabel(lo.support.adminNote).fill('Resolved by admin via E2E test');
    await updateDialog.getByRole('button', { name: lo.support.save }).click();
    await expect(updateDialog).not.toBeVisible();
  });
});

