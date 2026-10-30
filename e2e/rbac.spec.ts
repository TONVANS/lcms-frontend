import { expect, test } from '@playwright/test';
import { MODULES } from '../src/lib/constants/modules';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

test('admin lands on Home with three module cards', async ({ page }) => {
  await loginAs(page, 'admin');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: lo.home.openModule })).toHaveCount(3);
});

test('ppa.user lands on /ppa and /legal shows forbidden', async ({ page }) => {
  await loginAs(page, 'ppa.user');
  await expect(page).toHaveURL(/\/ppa$/);
  await page.goto('/legal');
  await expect(page.getByText(lo.forbidden.title).first()).toBeVisible();
});

// TODO(P6-12): Decide whether users without a business module land on /support or Home empty state.
test('none.user (no business module) lands on /support', async ({ page }) => {
  await loginAs(page, 'none.user');
  await expect(page).toHaveURL(/\/support$/);
});

for (const username of ['legal.user', 'legal.editor', 'legal.viewer'] as const) {
  test(`${username} lands on /legal and /contracts shows forbidden`, async ({ page }) => {
    await loginAs(page, username);
    await expect(page).toHaveURL(/\/legal$/);
    await page.goto('/contracts');
    await expect(page.getByText(lo.forbidden.title).first()).toBeVisible();
  });
}

for (const username of ['gc.user', 'gc.editor', 'gc.viewer'] as const) {
  test(`${username} lands on /contracts and /ppa shows forbidden`, async ({ page }) => {
    await loginAs(page, username);
    await expect(page).toHaveURL(/\/contracts$/);
    await expect(page.getByRole('heading', { level: 1, name: MODULES.gc.name })).toBeVisible();
    await page.goto('/ppa');
    await expect(page.getByText(lo.forbidden.title).first()).toBeVisible();
  });
}

test('non-admin is redirected away from /admin/users', async ({ page }) => {
  await loginAs(page, 'gc.user');
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/forbidden$/);
});

test('admin reaches the admin placeholder pages', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { level: 1, name: lo.admin.users })).toBeVisible();
});
