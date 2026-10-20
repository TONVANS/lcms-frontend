import type { Page } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';

export async function loginAs(page: Page, username: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(lo.auth.username).fill(username);
  await page.getByLabel(lo.auth.password, { exact: true }).fill('password');
  await page.getByRole('button', { name: lo.auth.submit, exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

export async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript((t) => {
    try {
      window.localStorage.setItem('theme', t);
    } catch {}
  }, theme);
}
