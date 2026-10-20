import { expect, test } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs } from './helpers';

test('defaults to dark, toggles to light, persists after reload', async ({ page }) => {
  await loginAs(page, 'admin');
  const html = page.locator('html');
  await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
  await page.getByRole('button', { name: lo.topbar.themeToggle }).click();
  await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
  await page.reload();
  await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
});
