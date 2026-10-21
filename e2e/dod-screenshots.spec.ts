import { expect, test } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs, setTheme } from './helpers';

test.skip(!process.env.DOD_SHOTS, 'set DOD_SHOTS=1 to capture DoD screenshots');

const shots: readonly { name: string; path: string; user: string | null; detail?: boolean }[] = [
  { name: 'login', path: '/login', user: null },
  { name: 'home', path: '/', user: 'admin' },
  { name: 'ppa', path: '/ppa', user: 'admin' },
  { name: 'forbidden', path: '/legal', user: 'ppa.user' },
  { name: 'gc-dashboard', path: '/contracts', user: 'admin' },
  { name: 'gc-list', path: '/contracts/list', user: 'admin' },
  { name: 'gc-detail', path: '/contracts/list', user: 'admin', detail: true },
  { name: 'gc-wizard', path: '/contracts/new', user: 'admin' },
  { name: 'gc-alerts', path: '/contracts/alerts', user: 'admin' },
];

for (const theme of ['dark', 'light'] as const) {
  for (const s of shots) {
    test(`dod screenshot ${s.name} ${theme}`, async ({ page }, testInfo) => {
      const width = testInfo.project.name === 'mobile' ? 360 : 1280;
      await setTheme(page, theme);
      if (s.user) await loginAs(page, s.user);
      await page.goto(s.path);
      await page.waitForLoadState('networkidle');
      if (s.path === '/contracts/list') {
        await page.getByRole('link', { name: /^GC-2026-/ }).first().waitFor();
      }
      if (s.detail) {
        // The id is read from the list: open the first row.
        await page.getByRole('link', { name: /^GC-2026-/ }).first().click();
        await expect(page.getByRole('heading', { name: lo.gc.detail.info })).toBeVisible();
        await expect(page.getByLabel(lo.common.loading)).toHaveCount(0);
      }
      await page.screenshot({
        path: `test-results/dod/${s.name}-${theme}-${width}.png`,
        fullPage: true,
      });
    });
  }
}
