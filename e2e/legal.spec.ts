import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { closeMainNav, loginAs, openMainNav } from './helpers';

const SEED_REG_ID = 'reg-1';
const SEED_REG_DOC_NAME = 'Regulation-351-KPIs-Signed.pdf';

const regRows = (page: Page): Locator =>
  page.getByRole('row').filter({ has: page.locator('a[href^="/legal/regulations/"]') });

const caseRows = (page: Page): Locator =>
  page.getByRole('row').filter({ has: page.locator('a[href^="/legal/cases/"]') });

async function waitForRegRows(page: Page): Promise<void> {
  await expect(regRows(page).first()).toBeVisible();
}

async function waitForCaseRows(page: Page): Promise<void> {
  await expect(caseRows(page).first()).toBeVisible();
}

test.describe('legal permissions', () => {
  test('legal.viewer: read-only everywhere', async ({ page }) => {
    await loginAs(page, 'legal.viewer');

    // Sidebar navigation check: viewer sees exactly 3 Legal items (overview, regulations, cases), no createLegal item
    await page.goto('/legal');
    const mainMenu = await openMainNav(page);
    await expect(mainMenu.getByRole('link', { name: lo.nav.dashboard })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.regulations })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.cases })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.createLegal })).toHaveCount(0);
    await closeMainNav(page);

    // Both dashboard sections render for a user holding both SystemModules
    await expect(page.getByRole('heading', { level: 2, name: lo.legal.dashboard.regulationsSection })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: lo.legal.dashboard.casesSection })).toBeVisible();

    // /legal/new redirects to /forbidden
    await page.goto('/legal/new');
    await expect(page).toHaveURL(/\/forbidden$/);

    // Documents list: no add, edit, delete, export
    await page.goto('/legal/regulations');
    await waitForRegRows(page);
    await expect(page.getByRole('button', { name: lo.legal.regulations.list.add })).toHaveCount(0);
    await expect(page.getByRole('button', { name: lo.legal.regulations.list.exportCsv })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp('^' + lo.legal.regulations.list.edit + ' ') })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp('^' + lo.legal.regulations.list.delete + ' ') })).toHaveCount(0);

    // Document detail: no edit, delete, upload, download
    await page.goto('/legal/regulations/' + SEED_REG_ID);
    await expect(page.getByRole('heading', { name: lo.legal.regulations.detail.info })).toBeVisible();
    await expect(page.getByRole('button', { name: lo.legal.regulations.list.edit, exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: lo.legal.regulations.list.delete, exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp('^' + lo.dropzone.download) })).toHaveCount(0);
    await expect(page.getByLabel(lo.dropzone.prompt)).toHaveCount(0);

    // Cases list: no add, edit, delete, export
    await page.goto('/legal/cases');
    await waitForCaseRows(page);
    await expect(page.getByRole('button', { name: lo.legal.cases.list.add })).toHaveCount(0);
    await expect(page.getByRole('button', { name: lo.legal.cases.list.exportCsv })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp('^' + lo.legal.cases.list.edit + ' ') })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp('^' + lo.legal.cases.list.delete + ' ') })).toHaveCount(0);

    // Case detail: no edit, delete
    await page.goto('/legal/cases/case-1');
    await expect(page.getByRole('heading', { name: lo.legal.cases.detail.info })).toBeVisible();
    await expect(page.getByRole('button', { name: lo.legal.cases.list.edit, exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: lo.legal.cases.list.delete, exact: true })).toHaveCount(0);
  });

  test('legal.editor: sees 4 Legal sidebar items including create', async ({ page }) => {
    await loginAs(page, 'legal.editor');
    await page.goto('/legal');
    const mainMenu = await openMainNav(page);
    await expect(mainMenu.getByRole('link', { name: lo.nav.dashboard })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.regulations })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.cases })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.createLegal })).toBeVisible();
  });
});

test.describe('legal crud flows', () => {
  test('legal.editor: legal document via modal (create, search, edit, delete)', async ({ page }) => {
    const stamp = Date.now();
    const title = 'E2E Document ' + stamp;
    const editedTitle = title + ' (Edited)';

    await loginAs(page, 'legal.editor');
    await page.goto('/legal/regulations');
    await waitForRegRows(page);

    // Editor cannot see export button
    await expect(page.getByRole('button', { name: lo.legal.regulations.list.exportCsv })).toHaveCount(0);

    // Create via modal
    await page.getByRole('button', { name: lo.legal.regulations.list.add }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(lo.legal.regulations.form.createTitle);

    await dialog.getByLabel(new RegExp(lo.legal.fields.docTitle)).fill(title);
    await dialog.getByLabel(new RegExp(lo.legal.fields.docNumberDate)).fill('E2E-' + stamp + '/EDL');
    await dialog.getByRole('combobox', { name: new RegExp(lo.legal.fields.department) }).click();
    await page.getByRole('option').first().click();

    await dialog.getByRole('button', { name: lo.legal.regulations.form.save }).click();
    await expect(dialog).toHaveCount(0);

    // Search for created record
    await page.getByRole('searchbox', { name: lo.legal.regulations.list.searchLabel }).fill(String(stamp));
    await expect(regRows(page)).toHaveCount(1);
    await expect(page.getByText(title)).toBeVisible();

    // Edit row
    await page.getByRole('button', { name: new RegExp('^' + lo.legal.regulations.list.edit + ' ') }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toContainText(lo.legal.regulations.form.editTitle);
    await editDialog.getByLabel(new RegExp(lo.legal.fields.docTitle)).fill(editedTitle);
    await editDialog.getByRole('button', { name: lo.legal.regulations.form.save }).click();
    await expect(editDialog).toHaveCount(0);
    await expect(page.getByText(editedTitle)).toBeVisible();

    // Delete row (move pointer away and clear toasts to prevent overlay interception on mobile)
    await page.mouse.move(0, 0);
    await page
      .locator('[data-sonner-toast]')
      .evaluateAll((toasts) => toasts.forEach((t) => (t as HTMLElement).remove()))
      .catch(() => {});
    await page.getByRole('button', { name: new RegExp('^' + lo.legal.regulations.list.delete + ' ') }).click();
    const confirmDialog = page.getByRole('dialog', { name: lo.legal.regulations.list.deleteTitle });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: lo.confirm.confirm }).click();
    await expect(confirmDialog).toHaveCount(0);
    await expect(regRows(page)).toHaveCount(0);
  });

  test('legal.editor: case via wizard, landing on detail, editing stage, then delete', async ({ page }) => {
    const stamp = Date.now();
    const defendant = 'Defendant E2E ' + stamp;
    const caseCode = 'E2E-' + stamp;

    await loginAs(page, 'legal.editor');
    await page.goto('/legal/new');

    // Chooser view offers both record types
    await expect(page.getByRole('heading', { level: 1, name: lo.legal.wizard.title })).toBeVisible();
    await expect(page.locator('a[href="/legal/new?kind=regulation"]')).toBeVisible();
    await page.locator('a[href="/legal/new?kind=case"]').click();

    // Case wizard step 1
    await expect(page).toHaveURL(/\/legal\/new\?kind=case$/);
    await expect(page.getByRole('heading', { level: 1, name: lo.legal.wizard.cases.title })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: lo.legal.wizard.cases.step1 })).toBeVisible();

    await page.getByLabel(new RegExp(lo.legal.fields.caseCode)).fill(caseCode);
    await page.getByLabel(new RegExp(lo.legal.fields.defendant)).fill(defendant);
    await page.getByRole('button', { name: new RegExp(lo.legal.fields.date) }).click();
    await page.getByRole('button', { name: new RegExp('^' + lo.datePicker.today + ', ') }).click();

    // Next to step 2
    await page.getByRole('button', { name: lo.legal.wizard.next }).click();
    await expect(page.getByRole('heading', { level: 2, name: lo.legal.wizard.cases.step2 })).toBeVisible();

    await page.getByLabel(new RegExp(lo.legal.fields.damage + '.*LAK')).fill('5000000');

    // Next to step 3
    await page.getByRole('button', { name: lo.legal.wizard.next }).click();
    await expect(page.getByRole('heading', { level: 2, name: lo.legal.wizard.cases.step3 })).toBeVisible();
    await expect(page.getByText(defendant).first()).toBeVisible();

    // Submit wizard
    await page.getByRole('button', { name: lo.legal.wizard.cases.submit }).click();

    // Redirected to detail page
    await expect(page).toHaveURL(/\/legal\/cases\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1, name: defendant })).toBeVisible();
    await expect(page.getByText(caseCode).first()).toBeVisible();

    // Edit the court stage on the detail page
    await page.getByRole('button', { name: lo.legal.cases.list.edit, exact: true }).click();
    const editModal = page.getByRole('dialog');
    await expect(editModal).toBeVisible();

    await editModal.getByRole('combobox', { name: new RegExp(lo.legal.fields.disputeStatus) }).click();
    await page.getByRole('option', { name: lo.legal.disputeStatus.RESOLVED }).click();
    await editModal.getByRole('button', { name: lo.legal.cases.form.save }).click();
    await expect(editModal).toHaveCount(0);

    // Detail stepper shows the resolved stage
    await expect(page.getByRole('navigation', { name: lo.stepper.nav })).toContainText(lo.legal.disputeStatus.RESOLVED);

    // Delete case from detail
    await page.getByRole('button', { name: lo.legal.cases.list.delete, exact: true }).click();
    const alertModal = page.getByRole('dialog', { name: lo.legal.cases.list.deleteTitle });
    await expect(alertModal).toBeVisible();
    await alertModal.getByRole('button', { name: lo.confirm.confirm }).click();
    await expect(alertModal).toHaveCount(0);

    // Routed back to /legal/cases
    await expect(page).toHaveURL(/\/legal\/cases$/);
  });
});

test.describe('export, download, print and url sync', () => {
  test('legal.user: exports legal documents CSV with status filter applied', async ({ page }) => {
    await loginAs(page, 'legal.user');
    await page.goto('/legal/regulations');
    await waitForRegRows(page);

    // Apply the ACTIVE status chip
    await page.getByRole('button', { name: lo.legal.docStatus.ACTIVE }).click();
    await expect(page).toHaveURL(/status=ACTIVE/);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: lo.legal.regulations.list.exportCsv }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^EDL_Legal_Documents_\d{4}-\d{2}-\d{2}\.csv$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const content = Buffer.concat(chunks).toString('utf8');

    // First character must be BOM
    expect(content.charCodeAt(0)).toBe(0xfeff);

    const lines = content.split('\r\n').filter((l) => l.trim().length > 0);
    expect(lines[0]).toContain(lo.legal.fields.docNumberDate);
    expect(lines[0]).toContain(lo.legal.fields.docTitle);
    expect(lines.length).toBeGreaterThan(1);
  });

  test('legal.user: downloads an attached file on reg-1', async ({ page }) => {
    await loginAs(page, 'legal.user');
    await page.goto('/legal/regulations/' + SEED_REG_ID);
    await expect(page.getByText(SEED_REG_DOC_NAME)).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: lo.dropzone.downloadFile(SEED_REG_DOC_NAME) }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('list filters survive reload via URL', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/legal/cases?disputeStatus=APPEAL');
    await waitForCaseRows(page);

    const chip = page.getByRole('button', { name: lo.legal.disputeStatus.APPEAL });
    await expect(chip).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await waitForCaseRows(page);
    await expect(page).toHaveURL(/disputeStatus=APPEAL/);
    await expect(page.getByRole('button', { name: lo.legal.disputeStatus.APPEAL })).toHaveAttribute('aria-pressed', 'true');
  });

  test('print media hides shell on /legal/cases', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/legal/cases');
    await waitForCaseRows(page);

    await page.emulateMedia({ media: 'print' });

    // Shell sidebar and banner must be hidden
    await expect(page.getByRole('navigation', { name: lo.nav.mainMenu })).not.toBeVisible();
    await expect(page.getByRole('banner')).not.toBeVisible();

    // Table must be visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('unknown document and case ids show not-found state with a way back', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto('/legal/regulations/unknown-id');
    await expect(page.getByText(lo.legal.regulations.detail.notFound)).toBeVisible();
    await expect(page.getByRole('link', { name: lo.legal.regulations.detail.backToList })).toBeVisible();

    await page.goto('/legal/cases/unknown-id');
    await expect(page.getByText(lo.legal.cases.detail.notFound)).toBeVisible();
    await expect(page.getByRole('link', { name: lo.legal.cases.detail.backToList })).toBeVisible();
  });

  test('regulation detail: uploads a PDF attachment, previews it, and deletes it', async ({ page }) => {
    await loginAs(page, 'legal.editor');
    await page.goto('/legal/regulations/reg-1');
    await expect(page.getByRole('heading', { name: lo.legal.regulations.detail.info })).toBeVisible();

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
