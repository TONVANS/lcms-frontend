import { expect, test } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

test('admin lands on Home with three module cards', async ({ page }) => {
  await loginAs(page, 'admin');
  await expect(page).toHaveURL('http://localhost:3100/');
  await expect(page.getByRole('link', { name: lo.home.openModule })).toHaveCount(3);
});

test('ppa.user lands on /ppa and /legal shows forbidden', async ({ page }) => {
  await loginAs(page, 'ppa.user');
  await expect(page).toHaveURL(/\/ppa$/);
  await page.goto('/legal');
  await expect(page.getByText(lo.forbidden.title).first()).toBeVisible();
});

test('multi.user sees two cards and the module switcher', async ({ page }, testInfo) => {
  await loginAs(page, 'multi.user');
  await expect(page).toHaveURL('http://localhost:3100/');
  await expect(page.getByRole('link', { name: lo.home.openModule })).toHaveCount(2);
  if (testInfo.project.name === 'desktop') {
    await page.getByRole('link', { name: lo.home.openModule }).first().click();
    await expect(page.getByRole('navigation', { name: lo.nav.moduleSwitcher })).toBeVisible();
  }
});

test('none.user lands on /forbidden', async ({ page }) => {
  await loginAs(page, 'none.user');
  await expect(page).toHaveURL(/\/forbidden$/);
  await expect(page.getByText(lo.forbidden.title).first()).toBeVisible();
});
