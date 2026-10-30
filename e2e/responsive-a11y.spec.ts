import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { lo } from '../src/lib/i18n/lo';
import { loginAs, setTheme } from './helpers';

type Ready = 'detail' | 'detail-editor' | 'not-found';

const pages: readonly { name: string; path: string; user: string | null; ready?: Ready }[] = [
  { name: 'login', path: '/login', user: null },
  { name: 'home', path: '/', user: 'admin' },
  { name: 'ppa', path: '/ppa', user: 'admin' },
  { name: 'ppa-contracts', path: '/ppa/contracts', user: 'admin' },
  { name: 'ppa-detail', path: '/ppa/contracts/ppa-1', user: 'admin' },
  { name: 'gc-dashboard', path: '/contracts', user: 'admin' },
  { name: 'gc-list', path: '/contracts/list', user: 'admin' },
  { name: 'gc-wizard', path: '/contracts/new', user: 'admin' },
  { name: 'gc-alerts', path: '/contracts/alerts', user: 'admin' },
  // Detail: the id is read from the list (first row link), never hard-coded. gc.editor sees the FileDropzone.
  { name: 'gc-detail', path: '/contracts/list', user: 'admin', ready: 'detail' },
  { name: 'gc-detail-editor', path: '/contracts/list', user: 'gc.editor', ready: 'detail-editor' },
  { name: 'gc-not-found', path: '/contracts/nope', user: 'admin', ready: 'not-found' },
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

/** Waits until the route has real content, not a skeleton. */
async function waitForReady(page: Page, ready: Ready | undefined, path: string): Promise<void> {
  if (path === '/contracts/list' && ready === undefined) {
    await page.getByRole('link', { name: /^GC-2026-/ }).first().waitFor();
  }
  if (ready === 'detail' || ready === 'detail-editor') {
    await page.getByRole('link', { name: /^GC-2026-/ }).first().click();
    await expect(page.getByRole('heading', { name: lo.gc.detail.info })).toBeVisible();
    // document list finished loading
    await expect(page.getByLabel(lo.common.loading)).toHaveCount(0);
    if (ready === 'detail-editor') {
      await expect(page.getByLabel(lo.dropzone.prompt)).toBeAttached();
      await expect(page.getByText(lo.dropzone.prompt)).toBeVisible();
    }
  }
  // Dashboard and alerts render skeletons first: wait for content that only exists once data has loaded.
  if (path === '/contracts') {
    await expect(page.getByRole('heading', { name: lo.gc.dashboard.byType })).toBeVisible();
  }
  if (path === '/ppa') {
    await expect(page.getByRole('heading', { level: 2, name: lo.ppa.dashboard.byProjectType })).toBeVisible();
  }
  if (path === '/ppa/contracts') {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(lo.ppa.title);
  }
  if (path === '/ppa/contracts/ppa-1') {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Nam Theun 2');
  }
  if (path === '/contracts/alerts') {
    await expect(
      page.getByRole('heading', { level: 2 }).first().or(page.getByText(lo.gc.alerts.empty)),
    ).toBeVisible();
  }
  if (ready === 'not-found') await expect(page.getByText(lo.gc.detail.notFound)).toBeVisible();
  if (path === '/legal') {
    await expect(page.getByRole('heading', { level: 2, name: lo.legal.dashboard.regulationsSection })).toBeVisible();
  }
  if (path === '/legal/regulations') {
    await page.locator('a[href^="/legal/regulations/"]').first().waitFor();
  }
  if (path === '/legal/cases') {
    await page.locator('a[href^="/legal/cases/"]').first().waitFor();
  }
  if (path === '/legal/new') {
    await expect(page.getByRole('heading', { level: 1, name: lo.legal.wizard.title })).toBeVisible();
  }
  if (path.startsWith('/legal/regulations/')) {
    await expect(page.getByRole('heading', { name: lo.legal.regulations.detail.info })).toBeVisible();
  }
  if (path.startsWith('/legal/cases/')) {
    await expect(page.getByRole('heading', { name: lo.legal.cases.detail.info })).toBeVisible();
  }
  if (path === '/notifications') {
    await expect(page.getByRole('heading', { level: 1, name: lo.topbar.notifications })).toBeVisible();
  }
  if (path === '/support') {
    await expect(page.getByRole('heading', { level: 1, name: lo.support.title })).toBeVisible();
  }
  if (path === '/admin/users') {
    await expect(page.getByRole('heading', { level: 1, name: lo.users.title })).toBeVisible();
  }
  if (path === '/admin/departments') {
    await expect(page.getByRole('heading', { level: 1, name: lo.admin.departments })).toBeVisible();
  }
  if (path === '/admin/contract-types') {
    await expect(page.getByRole('heading', { level: 1, name: lo.contractTypes.title })).toBeVisible();
  }
  if (path === '/admin/audit-logs') {
    await expect(page.getByRole('heading', { level: 1, name: lo.admin.auditLogs })).toBeVisible();
  }
}

for (const theme of ['dark', 'light'] as const) {
  for (const p of pages) {
    test.describe(`${p.name} ${theme}`, () => {
      test.beforeEach(async ({ page }) => {
        await setTheme(page, theme);
        if (p.user) await loginAs(page, p.user);
        await page.goto(p.path);
        await page.waitForLoadState('networkidle');
        // Table routes: wait for real rows, then let finite animations settle (axe samples colours mid-fade).
        await waitForReady(page, p.ready, p.path);
        await page.evaluate(async () => {
          const settle = Promise.all(
            document
              .getAnimations()
              .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
              .map((a) => a.finished.catch(() => undefined)),
          );
          await Promise.race([settle, new Promise((resolve) => setTimeout(resolve, 2000))]);
        });
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

test.describe('gc detail layout', () => {
  test('info list is a single column at 360px and two columns on desktop', async ({ page }, testInfo) => {
    await loginAs(page, 'admin');
    await page.goto('/contracts/list');
    await waitForReady(page, 'detail', '/contracts/list');
    const dl = page.getByRole('region', { name: lo.gc.detail.info }).locator('dl');
    const tracks = await dl.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(tracks).toBe(testInfo.project.name === 'mobile' ? 1 : 2);
  });
});

test.describe('sidebar navigation', () => {
  test('menu button opens the sidebar sheet on mobile, inline sidebar on desktop', async ({ page }, testInfo) => {
    await loginAs(page, 'gc.user');
    await page.goto('/contracts');
    const nav = page.getByRole('navigation', { name: lo.nav.mainMenu });
    if (testInfo.project.name === 'mobile') {
      await expect(nav).toBeHidden();
      await page.getByRole('button', { name: lo.topbar.menu }).click();
      await expect(page.getByRole('dialog').getByRole('navigation', { name: lo.nav.mainMenu })).toBeVisible();
    } else {
      await expect(nav).toBeVisible();
      await expect(page.getByRole('button', { name: lo.topbar.menu })).toBeHidden();
    }
  });
});
