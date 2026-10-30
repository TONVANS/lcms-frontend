import { expect, test } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

test.describe('admin pages', () => {
  test('non-admin hitting /admin/* is redirected to /forbidden', async ({ page }) => {
    await loginAs(page, 'gc.user');
    for (const route of ['/admin/users', '/admin/departments', '/admin/contract-types', '/admin/audit-logs']) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/forbidden$/);
      await expect(page.getByText(lo.forbidden.title).first()).toBeVisible();
    }
  });

  test('admin creates a user via HRM lookup, edits, and deletes user', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/users');

    await page.getByRole('button', { name: lo.users.add }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // HRM lookup with EDL-001
    await dialog.getByLabel(lo.users.form.employeeCode).fill('EDL-001');
    await dialog.getByRole('button', { name: lo.users.form.hrmLookup }).click();

    // Autofilled fields
    await expect(dialog.getByLabel(lo.users.form.fullName)).toHaveValue('ທ້າວ ສົມສັກ ສີສຸວັນ');
    await expect(dialog.getByLabel(lo.users.form.email)).toHaveValue('somsak@edl.com.la');

    // Save user
    await dialog.getByRole('button', { name: lo.users.form.save }).click();
    await expect(dialog).not.toBeVisible();

    // Newly created user appears in table
    await expect(page.getByText('EDL-001')).toBeVisible();

    // Edit user
    const editBtn = page.getByRole('button', { name: `${lo.users.edit} ທ້າວ ສົມສັກ ສີສຸວັນ` });
    await editBtn.click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();
    await editDialog.getByRole('button', { name: lo.users.form.save }).click();
    await expect(editDialog).not.toBeVisible();

    // Delete user
    const deleteBtn = page.getByRole('button', { name: `${lo.users.delete} ທ້າວ ສົມສັກ ສີສຸວັນ` });
    await deleteBtn.click();
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: lo.users.delete }).click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(page.getByText('EDL-001')).not.toBeVisible();
  });

  test('contract types CRUD and in-use protection', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/contract-types');

    // Add new contract type
    await page.getByRole('button', { name: lo.contractTypes.add }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const nameLo = `ປະເພດສັນຍາ E2E ${Date.now()}`;
    await dialog.getByLabel(lo.contractTypes.form.nameLo).fill(nameLo);
    await dialog.getByRole('button', { name: lo.contractTypes.form.save }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(nameLo)).toBeVisible();

    // Edit contract type
    const row = page.getByRole('row', { name: new RegExp(nameLo) });
    await row.getByRole('button', { name: `${lo.contractTypes.edit} ${nameLo}` }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();
    await editDialog.getByRole('button', { name: lo.contractTypes.form.save }).click();
    await expect(editDialog).not.toBeVisible();

    // Delete new contract type
    await row.getByRole('button', { name: `${lo.contractTypes.delete} ${nameLo}` }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: lo.contractTypes.delete }).click();
    await expect(confirm).not.toBeVisible();
    await expect(page.getByText(nameLo)).not.toBeVisible();

    // Try deleting an in-use contract type (row 1 is in-use ID 1)
    const inUseDeleteBtn = page.getByRole('button', { name: new RegExp(lo.contractTypes.delete) }).first();
    await inUseDeleteBtn.click();
    const inUseConfirm = page.getByRole('dialog');
    await expect(inUseConfirm).toBeVisible();
    await inUseConfirm.getByRole('button', { name: lo.contractTypes.delete }).click();
    // Dialog stays open displaying in-use error
    await expect(inUseConfirm).toBeVisible();
    await inUseConfirm.getByRole('button', { name: lo.confirm.cancel }).click();
  });

  test('departments CRUD, in-use protection, and HRM sync', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/departments');

    // Sync departments with HRM
    const syncBtn = page.getByRole('button', { name: lo.departments.sync });
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();
    await expect(page.getByText(new RegExp(lo.departments.syncDone.slice(0, 5)))).toBeVisible();

    // Add new department
    await page.getByRole('button', { name: lo.departments.add }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const deptName = `ພະແນກ E2E ${Date.now()}`;
    await dialog.getByLabel(lo.departments.form.name).fill(deptName);
    await dialog.getByLabel(lo.departments.form.code).fill(`D-${Date.now().toString().slice(-4)}`);
    await dialog.getByRole('button', { name: lo.departments.form.save }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(deptName)).toBeVisible();

    // Delete new department
    const row = page.getByRole('row', { name: new RegExp(deptName) });
    await row.getByRole('button', { name: `${lo.departments.delete} ${deptName}` }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: lo.departments.delete }).click();
    await expect(confirm).not.toBeVisible();
    await expect(page.getByText(deptName)).not.toBeVisible();

    // Try deleting an in-use department (first row)
    const inUseDeleteBtn = page.getByRole('button', { name: new RegExp(lo.departments.delete) }).first();
    await inUseDeleteBtn.click();
    const inUseConfirm = page.getByRole('dialog');
    await expect(inUseConfirm).toBeVisible();
    await inUseConfirm.getByRole('button', { name: lo.departments.delete }).click();
    // Dialog stays open displaying in-use error
    await expect(inUseConfirm).toBeVisible();
    await inUseConfirm.getByRole('button', { name: lo.confirm.cancel }).click();
  });

  test('audit logs list and details dialog', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1, name: lo.admin.auditLogs })).toBeVisible();
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    const detailsBtn = table.getByRole('button', { name: new RegExp(lo.auditLogs.viewDetails) }).first();
    await expect(detailsBtn).toBeVisible();
    await detailsBtn.click();

    const detailsDialog = page.getByRole('dialog');
    await expect(detailsDialog).toBeVisible();
    await expect(detailsDialog.getByRole('heading', { name: lo.auditLogs.detailsTitle })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(detailsDialog).not.toBeVisible();
  });
});
