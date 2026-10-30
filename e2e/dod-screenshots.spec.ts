import { expect, test } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs, setTheme } from './helpers';

test.skip(!process.env.DOD_SHOTS, 'set DOD_SHOTS=1 to capture DoD screenshots');

const shots: readonly { name: string; path: string; user: string | null; detail?: boolean }[] = [
  { name: 'login', path: '/login', user: null },
  { name: 'home', path: '/', user: 'admin' },
  { name: 'ppa', path: '/ppa', user: 'admin' },
  { name: 'ppa-contracts', path: '/ppa/contracts', user: 'admin' },
  { name: 'ppa-detail', path: '/ppa/contracts/ppa-1', user: 'admin' },
  { name: 'forbidden', path: '/legal', user: 'ppa.user' },
  { name: 'gc-dashboard', path: '/contracts', user: 'admin' },
  { name: 'gc-list', path: '/contracts/list', user: 'admin' },
  { name: 'gc-detail', path: '/contracts/list', user: 'admin', detail: true },
  { name: 'gc-wizard', path: '/contracts/new', user: 'admin' },
  { name: 'gc-alerts', path: '/contracts/alerts', user: 'admin' },
  { name: 'legal-dashboard', path: '/legal', user: 'admin' },
  { name: 'legal-regulations', path: '/legal/regulations', user: 'admin' },
  { name: 'legal-regulation-detail', path: '/legal/regulations/reg-1', user: 'admin' },
  { name: 'legal-cases', path: '/legal/cases', user: 'admin' },
  { name: 'legal-case-detail', path: '/legal/cases/case-1', user: 'admin' },
  { name: 'legal-new', path: '/legal/new', user: 'admin' },
  { name: 'notifications', path: '/notifications', user: 'admin' },
  { name: 'support', path: '/support', user: 'admin' },
  { name: 'admin-users', path: '/admin/users', user: 'admin' },
  { name: 'admin-departments', path: '/admin/departments', user: 'admin' },
  { name: 'admin-contract-types', path: '/admin/contract-types', user: 'admin' },
  { name: 'admin-audit-logs', path: '/admin/audit-logs', user: 'admin' },
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
      if (s.path === '/contracts') {
        await expect(page.getByRole('heading', { name: lo.gc.dashboard.byType })).toBeVisible();
      }
      if (s.path === '/contracts/alerts') {
        await expect(
          page.getByRole('heading', { level: 2 }).first().or(page.getByText(lo.gc.alerts.empty)),
        ).toBeVisible();
      }
      if (s.path === '/ppa') {
        // PPA dashboard section headings (h3) only render once the data has loaded.
        await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible();
      }
      if (s.path === '/ppa/contracts') {
        await expect(page.getByRole('heading', { level: 1 })).toContainText(lo.ppa.title);
      }
      if (s.path === '/ppa/contracts/ppa-1') {
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Nam Theun 2');
      }
      if (s.path === '/legal') {
        await expect(page.getByRole('heading', { level: 2, name: lo.legal.dashboard.regulationsSection })).toBeVisible();
      }
      if (s.path === '/legal/regulations') {
        await page.getByRole('link', { name: /^\d+\// }).first().waitFor();
      }
      if (s.path === '/legal/cases') {
        await page.getByRole('link', { name: /^LC-/ }).first().waitFor();
      }
      if (s.path === '/legal/new') {
        await expect(page.getByRole('heading', { level: 1, name: lo.legal.wizard.title })).toBeVisible();
      }
      if (s.path.startsWith('/legal/regulations/')) {
        await expect(page.getByRole('heading', { name: lo.legal.regulations.detail.info })).toBeVisible();
      }
      if (s.path.startsWith('/legal/cases/')) {
        await expect(page.getByRole('heading', { name: lo.legal.cases.detail.info })).toBeVisible();
      }
      if (s.path === '/notifications') {
        await expect(page.getByRole('heading', { level: 1, name: lo.topbar.notifications })).toBeVisible();
      }
      if (s.path === '/support') {
        await expect(page.getByRole('heading', { level: 1, name: lo.support.title })).toBeVisible();
      }
      if (s.path === '/admin/users') {
        await expect(page.getByRole('heading', { level: 1, name: lo.users.title })).toBeVisible();
      }
      if (s.path === '/admin/departments') {
        await expect(page.getByRole('heading', { level: 1, name: lo.admin.departments })).toBeVisible();
      }
      if (s.path === '/admin/contract-types') {
        await expect(page.getByRole('heading', { level: 1, name: lo.contractTypes.title })).toBeVisible();
      }
      if (s.path === '/admin/audit-logs') {
        await expect(page.getByRole('heading', { level: 1, name: lo.admin.auditLogs })).toBeVisible();
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
