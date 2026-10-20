import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { loginAs, setTheme } from './helpers';

const pages = [
  { name: 'login', path: '/login', user: null },
  { name: 'home', path: '/', user: 'admin' },
  { name: 'ppa', path: '/ppa', user: 'admin' },
] as const;

for (const theme of ['dark', 'light'] as const) {
  for (const p of pages) {
    test.describe(`${p.name} ${theme}`, () => {
      test.beforeEach(async ({ page }) => {
        await setTheme(page, theme);
        if (p.user) await loginAs(page, p.user);
        await page.goto(p.path);
        await page.waitForLoadState('networkidle');
      });

      test('no horizontal scroll', async ({ page }) => {
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        );
        expect(overflow).toBe(true);
      });

      test('no serious or critical axe violations', async ({ page }) => {
        const results = await new AxeBuilder({ page }).analyze();
        const bad = results.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ') + ' :: ' + n.html.slice(0, 160)) }));
        expect(bad).toEqual([]);
      });
    });
  }
}
