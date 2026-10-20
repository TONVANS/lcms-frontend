import { expect, test } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

test.describe('PPA Module (Phase 2)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'ppa.user');
  });

  test('navigates to PPA dashboard and shows KPIs and breakdown charts', async ({ page }) => {
    await page.goto('/ppa');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(lo.nav.dashboard);
    // KPIs should render
    await expect(page.getByText(lo.ppa.kpi.total, { exact: true })).toBeVisible();
    await expect(page.getByText(lo.ppa.kpi.activeCapacity)).toBeVisible();
    // Breakdown charts
    await expect(page.getByRole('heading', { name: 'ສະຖານະສັນຍາ' })).toBeVisible();
    await expect(page.getByText('ກຳລັງຕິດຕັ້ງແຍກຕາມປະເພດພະລັງງານ (MW)')).toBeVisible();
  });

  test('views contracts list and filters by status', async ({ page }) => {
    await page.goto('/ppa/contracts');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(lo.ppa.title);
    // Table should contain mock contract
    await expect(page.getByText('PPA-EDL-2010-001')).toBeVisible();
    // Filter chips (toggle buttons with aria-pressed) are rendered
    await expect(page.getByRole('button', { name: lo.table.all }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: lo.status.active })).toBeVisible();
  });

  test('opens contract detail page and verifies milestone timeline and documents', async ({ page }) => {
    await page.goto('/ppa/contracts/ppa-1');
    await expect(page.getByText('PPA-EDL-2010-001').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ເຂື່ອນໄຟຟ້າ ນ້ຳເທີນ 2 (Nam Theun 2)' })).toBeVisible();
    await expect(page.getByText(lo.ppa.historyTitle)).toBeVisible();
    await expect(page.getByText(lo.ppa.documentsTitle)).toBeVisible();
  });

  test('renders 4-step PPA wizard with live summary', async ({ page }) => {
    await page.goto('/ppa/new');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ສ້າງສັນຍາ');
    await expect(page.getByText(lo.ppa.wizard.step1).first()).toBeVisible();
    await expect(page.getByText(lo.ppa.wizard.summaryTitle)).toBeVisible();
  });

  test('views PPA alerts and filters', async ({ page }) => {
    await page.goto('/ppa/alerts');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(lo.ppa.alertsTitle);
    await expect(page.getByRole('button', { name: lo.table.all })).toBeVisible();
  });

  test('views PPA documents repository', async ({ page }) => {
    await page.goto('/ppa/documents');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(lo.ppa.documentsTitle);
    await expect(page.getByText(lo.dropzone.prompt)).toBeVisible();
  });
});
