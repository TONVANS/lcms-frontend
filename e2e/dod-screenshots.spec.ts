import { test } from '@playwright/test';
import { loginAs, setTheme } from './helpers';

test.skip(!process.env.DOD_SHOTS, 'set DOD_SHOTS=1 to capture DoD screenshots');

const shots = [
  { name: 'login', path: '/login', user: null },
  { name: 'home', path: '/', user: 'admin' },
  { name: 'ppa', path: '/ppa', user: 'admin' },
  { name: 'forbidden', path: '/legal', user: 'ppa.user' },
] as const;

for (const theme of ['dark', 'light'] as const) {
  for (const s of shots) {
    test(`dod screenshot ${s.name} ${theme}`, async ({ page }, testInfo) => {
      const width = testInfo.project.name === 'mobile' ? 360 : 1280;
      await setTheme(page, theme);
      if (s.user) await loginAs(page, s.user);
      await page.goto(s.path);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `test-results/dod/${s.name}-${theme}-${width}.png`,
        fullPage: true,
      });
    });
  }
}
