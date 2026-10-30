import { expect, test } from '@playwright/test';
import { SUPPORT_CONTACTS } from '../src/config/support';
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
  await expect(page).toHaveURL(/\/$/);
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
  await context.addCookies([{ name: 'lcms_session', value: 'mock:ghost', path: '/', domain: 'localhost' }]);
  let navigations = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations += 1;
  });
  await page.goto('/ppa');
  await expect(page).toHaveURL(/\/login\?reason=expired/);
  await expect(page.getByText(lo.auth.sessionExpired)).toBeVisible();
  await page.waitForTimeout(1000);
  expect(navigations).toBeLessThan(5);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === 'lcms_session')).toBeUndefined();
});

test('logout returns to login and protects routes again', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.getByRole('button', { name: lo.topbar.userMenu }).click();
  await page.getByRole('menuitem', { name: lo.auth.logout }).click();
  await expect(page).toHaveURL(/\/login\?reason=logout$/);
  await page.goto('/ppa');
  await expect(page).toHaveURL(/\/login\?next=%2Fppa/);
});

test('forgot password is a static contact-IT notice with no form', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: lo.auth.forgot }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByText(lo.auth.forgotContactIt)).toBeVisible();
  await expect(page.getByRole('link', { name: SUPPORT_CONTACTS.email })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await page.getByRole('link', { name: lo.auth.backToLogin }).click();
  await expect(page).toHaveURL(/\/login$/);
});
