import type { Locator, Page } from '@playwright/test';
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

/** Returns the main navigation, opening the mobile sidebar sheet first when the viewport hides the inline sidebar. */
export async function openMainNav(page: Page): Promise<Locator> {
  const inline = page.getByRole('navigation', { name: lo.nav.mainMenu });
  const menuButton = page.getByRole('button', { name: lo.topbar.menu });
  // Wait for hydration: exactly one of the inline nav (desktop) or the menu button (mobile) becomes visible.
  await inline.or(menuButton).first().waitFor();
  if (await menuButton.isVisible()) {
    await menuButton.click();
    return page.getByRole('dialog').getByRole('navigation', { name: lo.nav.mainMenu });
  }
  return inline;
}

/** Closes the mobile sidebar sheet if it is open (it makes the rest of the page inert). */
export async function closeMainNav(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible()) {
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
  }
}
