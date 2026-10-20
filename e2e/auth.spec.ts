import { expect, test } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

test('unauthenticated /ppa goes to login with next', async ({ page }) => {
  await page.goto('/ppa');
  await expect(page).toHaveURL(/\/login\?next=%2Fppa/);
});

test('login honours next and rejects off-site next', async ({ page }) => {
  await page.goto('/login?next=//evil.com');
  await page.getByLabel(lo.auth.username).fill('admin');
  await page.getByLabel(lo.auth.password, { exact: true }).fill('password');
  await page.getByRole('button', { name: lo.auth.submit, exact: true }).click();
  await expect(page).toHaveURL('http://localhost:3100/');
});

test('login honours a safe next', async ({ page }) => {
  await page.goto('/login?next=%2Fppa');
  await page.getByLabel(lo.auth.username).fill('admin');
  await page.getByLabel(lo.auth.password, { exact: true }).fill('password');
  await page.getByRole('button', { name: lo.auth.submit, exact: true }).click();
  await expect(page).toHaveURL(/\/ppa$/);
});

test('wrong password shows Lao error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(lo.auth.username).fill('admin');
  await page.getByLabel(lo.auth.password, { exact: true }).fill('wrong');
  await page.getByRole('button', { name: lo.auth.submit, exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: lo.errors.invalidCredentials })).toBeVisible();
});

test('stale session cookie ends on login with expired banner, no loop', async ({ page, context }) => {
  await context.addCookies([{ name: 'lcms_session', value: 'mock:ghost', url: 'http://localhost:3100' }]);
  let navigations = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations += 1;
  });
  await page.goto('/ppa');
  await expect(page).toHaveURL(/\/login\?reason=expired/);
  await expect(page.getByText(lo.auth.sessionExpired)).toBeVisible();
  await page.waitForTimeout(1000);
  expect(navigations).toBeLessThan(5);
});

test('logout returns to login and protects routes again', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.getByRole('button', { name: lo.topbar.userMenu }).click();
  await page.getByRole('menuitem', { name: lo.auth.logout }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/ppa');
  await expect(page).toHaveURL(/\/login\?next=%2Fppa/);
});
