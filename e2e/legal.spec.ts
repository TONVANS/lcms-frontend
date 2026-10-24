import { expect, test, type Locator, type Page } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

const SEED_REG_ID = 'reg-1';
const SEED_REG_DOC_NAME = 'Regulation-351-KPIs-Signed.pdf';

const regRows = (page: Page): Locator =>
  page.getByRole('row').filter({ has: page.getByRole('link', { name: /^(\d+\/|E2E-)/ }) });

const caseRows = (page: Page): Locator =>
  page.getByRole('row').filter({ has: page.getByRole('link', { name: /^LC-/ }) });

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
    const mainMenu = page.getByRole('navigation', { name: lo.nav.mainMenu });
    await expect(mainMenu.getByRole('link', { name: lo.nav.dashboard })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.regulations })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.cases })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.createLegal })).toHaveCount(0);

    // /legal/new redirects to /forbidden
    await page.goto('/legal/new');
    await expect(page).toHaveURL(/\/forbidden$/);

    // Regulations list: no add, edit, delete, export
    await page.goto('/legal/regulations');
    await waitForRegRows(page);
    await expect(page.getByRole('button', { name: lo.legal.regulations.list.add })).toHaveCount(0);
    await expect(page.getByRole('button', { name: lo.legal.regulations.list.exportCsv })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(`^${lo.legal.regulations.list.edit} `) })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(`^${lo.legal.regulations.list.delete} `) })).toHaveCount(0);

    // Regulation detail: no edit, delete, upload, download
    await page.goto(`/legal/regulations/${SEED_REG_ID}`);
    await expect(page.getByRole('heading', { name: lo.legal.regulations.detail.info })).toBeVisible();
    await expect(page.getByRole('button', { name: lo.legal.regulations.list.edit, exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: lo.legal.regulations.list.delete, exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(`^${lo.dropzone.download}`) })).toHaveCount(0);
    await expect(page.getByLabel(lo.dropzone.prompt)).toHaveCount(0);

    // Cases list: no add, edit, delete, export
    await page.goto('/legal/cases');
    await waitForCaseRows(page);
    await expect(page.getByRole('button', { name: lo.legal.cases.list.add })).toHaveCount(0);
    await expect(page.getByRole('button', { name: lo.legal.cases.list.exportCsv })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(`^${lo.legal.cases.list.edit} `) })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(`^${lo.legal.cases.list.delete} `) })).toHaveCount(0);

    // Case detail: no edit, delete
    await page.goto('/legal/cases/case-1');
    await expect(page.getByRole('heading', { name: lo.legal.cases.detail.info })).toBeVisible();
    await expect(page.getByRole('button', { name: lo.legal.cases.list.edit, exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: lo.legal.cases.list.delete, exact: true })).toHaveCount(0);
  });

  test('legal.editor: sees 4 Legal sidebar items including create', async ({ page }) => {
    await loginAs(page, 'legal.editor');
    await page.goto('/legal');
    const mainMenu = page.getByRole('navigation', { name: lo.nav.mainMenu });
    await expect(mainMenu.getByRole('link', { name: lo.nav.dashboard })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.regulations })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.cases })).toBeVisible();
    await expect(mainMenu.getByRole('link', { name: lo.nav.createLegal })).toBeVisible();
  });
});

test.describe('legal crud flows', () => {
  test('legal.editor: regulation via modal (create, search, edit, delete)', async ({ page }) => {
    const stamp = Date.now();
    const regNo = `E2E-${stamp}/EDL`;
    const title = `E2E Regulation ${stamp}`;
    const editedTitle = `${title} (Edited)`;

    await loginAs(page, 'legal.editor');
    await page.goto('/legal/regulations');
    await waitForRegRows(page);

    // Editor cannot see export button
    await expect(page.getByRole('button', { name: lo.legal.regulations.list.exportCsv })).toHaveCount(0);

    // Create via modal
    await page.getByRole('button', { name: lo.legal.regulations.list.add }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(lo.legal.regulations.form.createTitle);

    await dialog.getByLabel(new RegExp(lo.legal.fields.title)).fill(title);
    await dialog.getByLabel(new RegExp(lo.legal.fields.number)).fill(regNo);

    // Pick issuedDate
    await dialog.getByRole('button', { name: new RegExp(lo.legal.fields.issuedDate) }).click();
    await page.getByRole('button', { name: new RegExp(`^${lo.datePicker.today}, `) }).click();

    await dialog.getByRole('button', { name: lo.legal.regulations.form.save }).click();
    await expect(dialog).toHaveCount(0);

    // Search for created record
    await page.getByRole('searchbox', { name: lo.legal.regulations.list.searchLabel }).fill(regNo);
    await expect(regRows(page)).toHaveCount(1);
    await expect(page.getByText(title)).toBeVisible();

    // Edit row
    await page.getByRole('button', { name: new RegExp(`^${lo.legal.regulations.list.edit} `) }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toContainText(lo.legal.regulations.form.editTitle);
    await editDialog.getByLabel(new RegExp(lo.legal.fields.title)).fill(editedTitle);
    await editDialog.getByRole('button', { name: lo.legal.regulations.form.save }).click();
    await expect(editDialog).toHaveCount(0);
    await expect(page.getByText(editedTitle)).toBeVisible();

    // Delete row
    await page.getByRole('button', { name: new RegExp(`^${lo.legal.regulations.list.delete} `) }).click({ force: true });
    const confirmDialog = page.getByRole('dialog', { name: lo.legal.regulations.list.deleteTitle });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: lo.confirm.confirm }).click();
    await expect(confirmDialog).toHaveCount(0);
    await expect(regRows(page)).toHaveCount(0);
  });

  test('legal.editor: case via wizard, landing on detail, editing stage, then delete', async ({ page }) => {
    const stamp = Date.now();
    const defendant = `Defendant E2E ${stamp}`;
    const allegation = `Allegation E2E ${stamp}`;

    await loginAs(page, 'legal.editor');
    await page.goto('/legal/new');

    // Chooser view
    await expect(page.getByRole('heading', { level: 1, name: lo.legal.wizard.title })).toBeVisible();
    await page.locator('a[href="/legal/new?kind=case"]').click();

    // Case wizard step 1
    await expect(page).toHaveURL(/\/legal\/new\?kind=case$/);
    await expect(page.getByRole('heading', { level: 1, name: lo.legal.wizard.cases.title })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: lo.legal.wizard.cases.step1 })).toBeVisible();

    await page.getByLabel(new RegExp(lo.legal.fields.defendant)).fill(defendant);
    await page.getByLabel(new RegExp(lo.legal.fields.allegation)).fill(allegation);
    await page.getByLabel(new RegExp(lo.legal.fields.handlingUnit)).fill('Special Unit');

    // Next to step 2
    await page.getByRole('button', { name: lo.legal.wizard.next }).click();
    await expect(page.getByRole('heading', { level: 2, name: lo.legal.wizard.cases.step2 })).toBeVisible();

    const damageInput = page.getByLabel(new RegExp(`${lo.legal.fields.damage}.*LAK`));
    await damageInput.fill('5000000');

    // Next to step 3
    await page.getByRole('button', { name: lo.legal.wizard.next }).click();
    await expect(page.getByRole('heading', { level: 2, name: lo.legal.wizard.cases.step3 })).toBeVisible();
    await expect(page.getByText(defendant).first()).toBeVisible();

    // Submit wizard
    await page.getByRole('button', { name: lo.legal.wizard.cases.submit }).click();

    // Redirected to detail page
    await expect(page).toHaveURL(/\/legal\/cases\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1, name: defendant })).toBeVisible();
    await expect(page.getByText(/LC-\d{4}-\d+/).first()).toBeVisible();

    // Edit stage on detail page
    await page.getByRole('button', { name: lo.legal.cases.list.edit }).click();
    const editModal = page.getByRole('dialog');
    await expect(editModal).toBeVisible();

    // Select completed stage
    await editModal.getByRole('combobox', { name: new RegExp(lo.legal.fields.stage) }).click();
    await page.getByRole('option', { name: lo.legal.caseStages.completed }).click();
    await editModal.getByRole('button', { name: lo.legal.cases.form.save }).click();
    await expect(editModal).toHaveCount(0);

    // Detail stepper shows completed
    await expect(page.getByRole('navigation', { name: lo.stepper.nav })).toContainText(lo.legal.caseStages.completed);

    // Delete case from detail
    await page.getByRole('button', { name: lo.legal.cases.list.delete }).click();
    const alertModal = page.getByRole('dialog', { name: lo.legal.cases.list.deleteTitle });
    await expect(alertModal).toBeVisible();
    await alertModal.getByRole('button', { name: lo.confirm.confirm }).click();
    await expect(alertModal).toHaveCount(0);

    // Routed back to /legal/cases
    await expect(page).toHaveURL(/\/legal\/cases$/);
  });
});

test.describe('export, download, print and url sync', () => {
  test('legal.user: exports regulations CSV with status filter applied', async ({ page }) => {
    await loginAs(page, 'legal.user');
    await page.goto('/legal/regulations');
    await waitForRegRows(page);

    // Apply in_force filter chip
    const inForceChip = page.getByRole('button', { name: lo.legal.regulationStatus.in_force });
    await inForceChip.click();
    await expect(page).toHaveURL(/status=in_force/);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: lo.legal.regulations.list.exportCsv }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^EDL_Legal_Regulations_\d{4}-\d{2}-\d{2}\.csv$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const content = Buffer.concat(chunks).toString('utf8');

    // First character must be BOM \uFEFF
    expect(content.charCodeAt(0)).toBe(0xfeff);

    // Check header line
    const lines = content.split('\r\n').filter((l) => l.trim().length > 0);
    expect(lines[0]).toContain(lo.legal.fields.number);
    expect(lines[0]).toContain(lo.legal.fields.title);
  });

  test('legal.user: downloads an attached file on reg-1', async ({ page }) => {
    await loginAs(page, 'legal.user');
    await page.goto(`/legal/regulations/${SEED_REG_ID}`);
    await expect(page.getByText(SEED_REG_DOC_NAME)).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: lo.dropzone.downloadFile(SEED_REG_DOC_NAME) }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('list filters survive reload via URL', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/legal/cases?stage=appeal');
    await waitForCaseRows(page);

    const chip = page.getByRole('button', { name: lo.legal.caseStages.appeal });
    await expect(chip).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await waitForCaseRows(page);
    await expect(page).toHaveURL(/stage=appeal/);
    await expect(page.getByRole('button', { name: lo.legal.caseStages.appeal })).toHaveAttribute('aria-pressed', 'true');
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

  test('unknown regulation and case ids show not-found state with a way back', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto('/legal/regulations/unknown-id');
    await expect(page.getByText(lo.legal.regulations.detail.notFound)).toBeVisible();
    await expect(page.getByRole('link', { name: lo.legal.regulations.detail.backToList })).toBeVisible();

    await page.goto('/legal/cases/unknown-id');
    await expect(page.getByText(lo.legal.cases.detail.notFound)).toBeVisible();
    await expect(page.getByRole('link', { name: lo.legal.cases.detail.backToList })).toBeVisible();
  });
});
