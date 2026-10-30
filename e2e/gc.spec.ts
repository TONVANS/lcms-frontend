import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { STATUS_META } from '../src/lib/constants/status';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

// The mock API lives in browser memory, so a full page load (page.goto / reload) resets its data to the
// seed. Every flow below that mutates data therefore continues by in-app navigation (clicks) only.

const SEED_DOC_CONTRACT_NO = 'GC-2026-001'; // documents.mock seeds a signed PDF for this contract
const SEED_DOC_NAME = 'GC-2026-001-Contract-Signed.pdf';

const dataRows = (page: Page): Locator =>
  page.getByRole('row').filter({ has: page.getByRole('link', { name: /^(GC-2026-|E2E-)/ }) });

async function waitForRows(page: Page): Promise<void> {
  await expect(dataRows(page).first()).toBeVisible();
}

async function searchList(page: Page, text: string): Promise<void> {
  await page.getByRole('searchbox', { name: lo.gc.list.searchLabel }).fill(text);
}

/** From /contracts/list, filter to one contract number and open its detail by clicking the link. */
async function openContractByNo(page: Page, no: string): Promise<void> {
  await waitForRows(page);
  await searchList(page, no);
  await expect(dataRows(page)).toHaveCount(1);
  await page.getByRole('link', { name: no, exact: true }).click();
  await expect(page).toHaveURL(/\/contracts\/[^/]+$/);
  await expect(page.getByRole('heading', { name: lo.gc.detail.info })).toBeVisible();
}

/** Opens the date picker named `label` (within `scope`) and picks today in the calendar popover. */
async function pickToday(page: Page, scope: Page | Locator, label: string): Promise<void> {
  const label_ = new RegExp(`^${label}`);
  await scope.getByRole('button', { name: label_ }).click();
  // The calendar labels today's cell with the 'today' prefix, so no date arithmetic is needed.
  await page.getByRole('button', { name: new RegExp(`^${lo.datePicker.today}, `) }).click();
  // Wait for the popover to leave the DOM so the next picker never sees two calendars.
  await expect(page.getByRole('dialog', { name: lo.datePicker.open })).toHaveCount(0);
}

/** A form control by its label; the required marker (*) is part of the label text. */
function field(scope: Page | Locator, label: string): Locator {
  return scope.getByLabel(new RegExp(String.raw`^${label}\s*\*?$`));
}

/** Picks a contract type from the (async-loaded) select inside `scope`. */
async function pickType(page: Page, scope: Page | Locator, name: string): Promise<void> {
  await scope.getByRole('combobox', { name: new RegExp(`^${lo.gc.fields.contractTypeId}`) }).click();
  await page.getByRole('option', { name, exact: true }).click();
}

async function listAs(page: Page, user: string): Promise<void> {
  await loginAs(page, user);
  await page.goto('/contracts/list');
  await waitForRows(page);
}

test.describe('permissions', () => {
  test('gc.viewer: read-only everywhere', async ({ page }) => {
    await listAs(page, 'gc.viewer');
    await expect(page.getByRole('heading', { level: 1, name: lo.gc.list.title })).toBeVisible();
    await expect(page.getByRole('button', { name: lo.gc.list.create, exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: lo.gc.list.openWizard })).toHaveCount(0);
    await expect(page.getByRole('link', { name: lo.nav.create })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(`^${lo.gc.list.edit} `) })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(`^${lo.gc.list.delete} `) })).toHaveCount(0);

    await openContractByNo(page, SEED_DOC_CONTRACT_NO);
    await expect(page.getByText(SEED_DOC_NAME)).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(`^${lo.dropzone.download}`) })).toHaveCount(0);
    await expect(page.getByRole('button', { name: lo.gc.list.edit, exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: lo.gc.list.delete, exact: true })).toHaveCount(0);
    await expect(page.getByLabel(lo.dropzone.prompt)).toHaveCount(0);

    await page.goto('/contracts/new');
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  test('gc.user (main): downloads an attached file', async ({ page }) => {
    await listAs(page, 'gc.user');
    await openContractByNo(page, SEED_DOC_CONTRACT_NO);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: lo.dropzone.downloadFile(SEED_DOC_NAME) }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.(pdf|docx?|png|jpe?g)$/);
  });

  test('gc.editor: cannot download an attached file', async ({ page }) => {
    await listAs(page, 'gc.editor');
    await openContractByNo(page, SEED_DOC_CONTRACT_NO);
    await expect(page.getByText(SEED_DOC_NAME)).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(`^${lo.dropzone.download}`) })).toHaveCount(0);
  });
});

test.describe('crud', () => {
  test('gc.editor: create via modal, find by search, edit, delete', async ({ page }) => {
    const no = `E2E-${Date.now()}`;
    const title = `E2E contract ${no}`;
    const editedTitle = `${title} edited`;
    await listAs(page, 'gc.editor');

    // create
    await page.getByRole('button', { name: lo.gc.list.create, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: lo.gc.form.createTitle });
    await field(dialog, lo.gc.fields.title).fill(title);
    await field(dialog, lo.gc.fields.contractNumber).fill(no);
    await pickType(page, dialog, lo.gc.types.land_lease);
    await pickToday(page, dialog, lo.gc.fields.signedDate);
    await pickToday(page, dialog, lo.gc.fields.effectiveDate);
    await dialog.getByRole('button', { name: lo.gc.form.save, exact: true }).click();
    await expect(dialog).toBeHidden();

    // find by search: exactly one row
    await searchList(page, no);
    await expect(dataRows(page)).toHaveCount(1);
    await expect(page.getByRole('link', { name: no, exact: true })).toBeVisible();

    // edit
    await page.getByRole('button', { name: `${lo.gc.list.edit} ${no}` }).click();
    const editDialog = page.getByRole('dialog', { name: lo.gc.form.editTitle });
    await field(editDialog, lo.gc.fields.title).fill(editedTitle);
    await editDialog.getByRole('button', { name: lo.gc.form.save, exact: true }).click();
    await expect(editDialog).toBeHidden();
    await expect(page.getByText(editedTitle)).toBeVisible();

    // delete. A hovered toast never auto-dismisses and can sit over the row actions on narrow screens,
    // so move the pointer away first.
    await page.mouse.move(0, 0);
    await page.getByRole('button', { name: `${lo.gc.list.delete} ${no}` }).click();
    const confirm = page.getByRole('dialog', { name: lo.gc.list.deleteTitle });
    await confirm.getByRole('button', { name: lo.confirm.confirm, exact: true }).click();
    await expect(confirm).toBeHidden();
    await expect(page.getByRole('link', { name: no, exact: true })).toHaveCount(0);
    await expect(page.getByText(lo.table.noData)).toBeVisible();
  });

  test('gc.editor: edits and deletes from the detail page', async ({ page }) => {
    await listAs(page, 'gc.editor');
    await openContractByNo(page, 'GC-2026-002');
    await page.getByRole('button', { name: lo.gc.list.edit, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: lo.gc.form.editTitle });
    await field(dialog, lo.gc.fields.title).fill('E2E detail edit');
    await dialog.getByRole('button', { name: lo.gc.form.save, exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { level: 1, name: 'E2E detail edit' })).toBeVisible();

    // gc.editor holds the delete permission
    await page.getByRole('button', { name: lo.gc.list.delete, exact: true }).click();
    await page
      .getByRole('dialog', { name: lo.gc.list.deleteTitle })
      .getByRole('button', { name: lo.confirm.confirm, exact: true })
      .click();
    await expect(page).toHaveURL(/\/contracts\/list$/);
  });
});

test('wizard creates a contract and lands on its detail', async ({ page }) => {
  const no = `E2E-W-${Date.now()}`;
  const title = `E2E wizard ${no}`;
  await loginAs(page, 'gc.editor');
  await page.goto('/contracts/new');
  await expect(page.getByRole('heading', { level: 1, name: lo.gc.wizard.title })).toBeVisible();

  const next = page.getByRole('button', { name: lo.gc.wizard.next, exact: true });
  await field(page, lo.gc.fields.title).fill(title);
  await field(page, lo.gc.fields.contractNumber).fill(no);
  await pickType(page, page, lo.gc.types.moa);
  await next.click();
  await expect(page.getByRole('heading', { level: 2, name: lo.gc.wizard.step2 })).toBeVisible();
  await pickToday(page, page, lo.gc.fields.signedDate);
  await pickToday(page, page, lo.gc.fields.effectiveDate);
  await next.click();
  await expect(page.getByRole('heading', { level: 2, name: lo.gc.wizard.step3 })).toBeVisible();
  await next.click();
  await expect(page.getByRole('heading', { level: 2, name: lo.gc.wizard.step4 })).toBeVisible();

  await page.getByLabel(lo.dropzone.prompt).setInputFiles({
    name: 'e2e-annex.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 e2e'),
  });
  await page.getByRole('button', { name: lo.gc.wizard.submit, exact: true }).click();

  await expect(page).toHaveURL(/\/contracts\/(?!list$|new$|alerts$)[^/]+$/);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(page.getByText('e2e-annex.pdf')).toBeVisible();
});

test.describe('alerts and dashboard', () => {
  test('alerts page lists expiring contracts and contract notifications', async ({ page }) => {
    await loginAs(page, 'gc.user');
    await page.goto('/contracts/alerts');
    const group = page.getByRole('region', { name: lo.gc.alerts.expiringSection });
    await expect(page.getByRole('heading', { name: lo.gc.alerts.expiringSection })).toBeVisible();
    await expect(group.getByRole('listitem').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: lo.gc.alerts.notificationsSection })).toBeVisible();
  });

  test('marking an alert read removes its unread dot and decrements the bell', async ({ page }) => {
    await loginAs(page, 'gc.user');
    await page.goto('/contracts/alerts');
    const marks = page.getByRole('button', { name: new RegExp(`^${lo.gc.alerts.markRead}`) });
    await expect(marks.first()).toBeVisible();

    const bell = page.getByRole('button', { name: new RegExp(`^${lo.topbar.notifications}`) });
    const bellCount = async (): Promise<number> => {
      const name = (await bell.getAttribute('aria-label')) ?? '';
      const m = name.match(/(\d+)/);
      return m ? Number(m[1]) : 0;
    };
    await expect.poll(bellCount).toBeGreaterThan(0);
    const bellBefore = await bellCount();
    const dotsBefore = await marks.count();

    await marks.first().click();

    await expect(marks).toHaveCount(dotsBefore - 1);
    await expect.poll(bellCount).toBe(bellBefore - 1);
    // each row keeps exactly one unread marker per unread alert
    await expect(page.getByText(lo.topbar.unread, { exact: true })).toHaveCount(dotsBefore - 1);
  });

  test('dashboard expiring KPI equals the rows of the expiring list', async ({ page }) => {
    await loginAs(page, 'gc.user');
    await page.goto('/contracts');
    const kpi = page.locator('a[href="/contracts/list?status=EXPIRING_SOON"]');
    await expect(kpi).toBeVisible();
    const kpiValue = Number((await kpi.getByText(/^\d+$/).innerText()).replace(/\D/g, ''));
    expect(kpiValue).toBeGreaterThan(0);

    await kpi.click();
    await expect(page).toHaveURL(/\/contracts\/list\?status=EXPIRING_SOON/);
    await waitForRows(page);
    await expect(page.getByRole('button', { name: STATUS_META.EXPIRING_SOON.label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // the default page size (10) is only a cap, so make sure the whole result fits on one page
    expect(kpiValue).toBeLessThanOrEqual(10);
    await expect(dataRows(page)).toHaveCount(kpiValue);
  });

  test('support item in the user menu navigates to the support page', async ({ page }) => {
    await loginAs(page, 'gc.user');
    await page.goto('/contracts');
    await page.getByRole('button', { name: lo.topbar.userMenu }).click();
    await page.getByRole('menuitem', { name: lo.support.menu }).click();
    await expect(page).toHaveURL(/\/support$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('list filters and navigation', () => {
  test('list filters survive reload via URL', async ({ page }) => {
    await loginAs(page, 'gc.user');
    await page.goto('/contracts/list');
    await waitForRows(page);
    await page.getByRole('button', { name: STATUS_META.EXPIRING_SOON.label, exact: true }).click();
    await expect(page).toHaveURL(/status=EXPIRING_SOON/);

    await page.reload();
    await waitForRows(page);
    await expect(page.getByRole('button', { name: STATUS_META.EXPIRING_SOON.label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const rows = dataRows(page);
    const total = await rows.count();
    expect(total).toBeGreaterThan(0);
    await expect(rows.filter({ hasText: STATUS_META.EXPIRING_SOON.label })).toHaveCount(total);
  });

  test('a row contract number opens the detail and the back link returns to the list', async ({ page }) => {
    await listAs(page, 'gc.user');
    const first = page.getByRole('link', { name: /^GC-2026-/ }).first();
    const no = (await first.innerText()).trim();
    await first.click();
    await expect(page).toHaveURL(/\/contracts\/[^/]+$/);
    await expect(page).not.toHaveURL(/\/contracts\/(list|new|alerts)$/);
    await expect(page.getByRole('heading', { name: lo.gc.detail.info })).toBeVisible();
    await expect(page.getByText(no).first()).toBeVisible();

    await page.getByRole('link', { name: lo.gc.detail.backToList }).click();
    await expect(page).toHaveURL(/\/contracts\/list$/);
    await expect(page.getByRole('heading', { level: 1, name: lo.gc.list.title })).toBeVisible();
  });

  test('static /contracts/list and /contracts/new are not captured by [id]', async ({ page }) => {
    await loginAs(page, 'gc.editor');
    await page.goto('/contracts/list');
    await expect(page.getByRole('heading', { level: 1, name: lo.gc.list.title })).toBeVisible();
    await expect(page.getByText(lo.gc.detail.notFound)).toHaveCount(0);
    await page.goto('/contracts/new');
    await expect(page.getByRole('heading', { level: 1, name: lo.gc.wizard.title })).toBeVisible();
    await expect(page.getByText(lo.gc.detail.notFound)).toHaveCount(0);
  });

  test('an unknown id shows the not-found state with a way back', async ({ page }) => {
    await loginAs(page, 'gc.user');
    await page.goto('/contracts/nope');
    await expect(page.getByText(lo.gc.detail.notFound)).toBeVisible();
    await page.getByRole('link', { name: lo.gc.detail.backToList }).click();
    await expect(page).toHaveURL(/\/contracts\/list$/);
  });
});

test.describe('focus return in a real browser', () => {
  test('list: cancelling the delete dialog returns focus to that row delete button', async ({ page }) => {
    await listAs(page, 'gc.editor');
    const second = dataRows(page).nth(1);
    const no = (await second.getByRole('link').first().innerText()).trim();
    const trigger = page.getByRole('button', { name: `${lo.gc.list.delete} ${no}` });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: lo.gc.list.deleteTitle });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: lo.confirm.cancel, exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('detail: cancelling the edit dialog returns focus to Edit', async ({ page }) => {
    await listAs(page, 'gc.editor');
    await page.getByRole('link', { name: /^GC-2026-/ }).first().click();
    const edit = page.getByRole('button', { name: lo.gc.list.edit, exact: true });
    await edit.click();
    const dialog = page.getByRole('dialog', { name: lo.gc.form.editTitle });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: lo.gc.form.cancel, exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(edit).toBeFocused();
  });

  test('detail: uploads a PDF attachment, previews it, and deletes it', async ({ page }) => {
    await listAs(page, 'gc.editor');
    await page.getByRole('link', { name: /^GC-2026-/ }).first().click();
    await expect(page.getByRole('heading', { name: lo.gc.detail.info })).toBeVisible();

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