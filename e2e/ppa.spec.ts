import path from 'node:path';
import { expect, test } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

test.describe('Power contracts module (/ppa)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ppa.user');
  });

  test('dashboard shows KPIs, status and project type breakdowns', async ({ page }) => {
    await page.goto('/ppa');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(lo.ppa.dashboard.title);
    await expect(page.getByText(lo.ppa.dashboard.kpiTotal, { exact: true })).toBeVisible();
    await expect(page.getByText(lo.ppa.dashboard.kpiCapacity)).toBeVisible();
    await expect(page.getByRole('heading', { name: lo.ppa.dashboard.byStatus })).toBeVisible();
    await expect(page.getByRole('heading', { name: lo.ppa.dashboard.byProjectType })).toBeVisible();
    await expect(page.getByRole('heading', { name: lo.ppa.dashboard.expiringList })).toBeVisible();
  });

  test('list shows contracts and filters by contract type', async ({ page }) => {
    await page.goto('/ppa/contracts');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(lo.ppa.title);
    await expect(page.getByText('PPA-EDL-2010-001')).toBeVisible();
    await page.getByRole('button', { name: lo.ppa.types.SALE, exact: true }).click();
    await expect(page.getByText('PSA-EDL-2020-001')).toBeVisible();
    await expect(page.getByText('PPA-EDL-2010-001')).toHaveCount(0);
    await expect(page).toHaveURL(/type=SALE/);
  });

  test('opens contract detail with documents and history', async ({ page }) => {
    await page.goto('/ppa/contracts/ppa-1');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Nam Theun 2');
    await expect(page.getByText('PPA-EDL-2010-001').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: lo.ppa.detail.documents })).toBeVisible();
    await expect(page.getByRole('heading', { name: lo.history.title })).toBeVisible();
  });

  test('wizard renders step 1 with the conditional project type field', async ({ page }) => {
    await page.goto('/ppa/new');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(lo.ppa.wizard.title);
    await expect(page.getByText(lo.ppa.wizard.summary)).toBeVisible();
    await expect(page.getByRole('combobox', { name: new RegExp(lo.ppa.fields.projectType) })).toBeVisible();
    await page.getByRole('radio', { name: lo.ppa.types.SALE }).click();
    await expect(page.getByRole('textbox', { name: new RegExp(lo.ppa.fields.customer) })).toBeVisible();
  });

  test('alerts page lists expiring contracts and notifications', async ({ page }) => {
    await page.goto('/ppa/alerts');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(lo.ppa.alerts.title);
    await expect(page.getByRole('heading', { name: lo.ppa.alerts.expiringSoon })).toBeVisible();
    await expect(page.getByRole('heading', { name: lo.ppa.alerts.notifications })).toBeVisible();
  });

  test('the documents library route no longer exists', async ({ page }) => {
    const res = await page.goto('/ppa/documents');
    expect(res?.status()).toBe(404);
  });

  test('PPA contract detail uploads a PDF attachment, previews it, and deletes it', async ({ page }) => {
    await page.goto('/ppa/contracts/ppa-1');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Nam Theun 2');

    const fixturePath = path.resolve(__dirname, 'fixtures/sample.pdf');
    await page.getByLabel(lo.dropzone.prompt).setInputFiles(fixturePath);
    await expect(page.getByText('sample.pdf')).toBeVisible();

    await page.getByRole('button', { name: lo.dropzone.previewFile('sample.pdf') }).click();
    const previewDialog = page.getByRole('dialog');
    await expect(previewDialog).toBeVisible();
    await expect(previewDialog.getByText('sample.pdf')).toBeVisible();
    await previewDialog.getByRole('button', { name: lo.common.close }).click();
    await expect(previewDialog).not.toBeVisible();

    await page.getByRole('button', { name: lo.dropzone.deleteFile('sample.pdf') }).click();
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: lo.confirm.confirm }).click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(page.getByText('sample.pdf')).not.toBeVisible();
  });
});
