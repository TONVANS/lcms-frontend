import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPPORT_CONTACTS } from '@/config/support';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { gcService, type GcDashboard } from '../api/gc.service';
import { gcMockDb } from '../mocks/gc.mock';
import { GcDashboardView } from './gc-dashboard-view';

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

const payload = (over: Partial<GcDashboard> = {}): GcDashboard => ({
  total: 42,
  byStatus: { pending: 4, active: 25, expiring: 7, expired: 6 },
  byType: [
    { type: 'moa', count: 2 },
    { type: 'epc', count: 9 },
    { type: 'pta', count: 5 },
  ],
  valueTotals: [
    { currency: 'LAK', amount: 1_200_000, count: 4 },
    { currency: 'USD', amount: 0, count: 0 },
    { currency: 'CNY', amount: 50_000, count: 1 },
  ],
  upcoming: [],
  ...over,
});

beforeEach(() => {
  vi.restoreAllMocks();
  installMocks(api, { delay: 0 });
  gcMockDb.reset(new Date());
});

describe('GcDashboardView', () => {
  it('shows KPI counts from the dashboard payload and drills down by link', async () => {
    session('gc.viewer');
    vi.spyOn(gcService, 'dashboard').mockResolvedValue(payload());
    render(<GcDashboardView />);
    const cases: [string, string, string][] = [
      [lo.gc.dashboard.kpiTotal, '42', '/contracts/list'],
      [lo.gc.dashboard.kpiActive, '25', '/contracts/list?status=active'],
      [lo.gc.dashboard.kpiExpiring, '7', '/contracts/list?status=expiring'],
      [lo.gc.dashboard.kpiExpired, '6', '/contracts/list?status=expired'],
    ];
    for (const [label, value, href] of cases) {
      await screen.findAllByText(label);
      const link = screen
        .getAllByText(label)
        .map((e) => e.closest('a'))
        .find((x) => x !== null)!;
      expect(link).toHaveAttribute('href', href);
      expect(within(link).getByText(value, { exact: true })).toBeInTheDocument();
      // The link holds the label and the value only.
      expect(link.textContent).toBe(`${label}${value}`);
    }
  });

  it('shows per-currency totals and counts exactly, without conversion', async () => {
    session('gc.viewer');
    vi.spyOn(gcService, 'dashboard').mockResolvedValue(payload());
    render(<GcDashboardView />);
    const card = async (cur: 'LAK' | 'USD' | 'CNY') =>
      (await screen.findByText(lo.gc.dashboard.valueTotal(lo.currency[cur]))).parentElement!;
    const expectCard = async (cur: 'LAK' | 'USD' | 'CNY', value: string, count: number) => {
      const el = await card(cur);
      expect(within(el).getByText(value, { exact: true })).toBeInTheDocument();
      expect(
        within(el).getByText(lo.gc.dashboard.contractsCount(count), { exact: true }),
      ).toBeInTheDocument();
    };
    await expectCard('LAK', '1,200,000', 4);
    await expectCard('USD', '0', 0);
    await expectCard('CNY', '50,000', 1);

    const labels = (['LAK', 'USD', 'CNY'] as const).map((c) =>
      lo.gc.dashboard.valueTotal(lo.currency[c]),
    );
    const order = screen.getAllByText((t) => labels.includes(t)).map((e) => e.textContent);
    expect(order).toEqual(labels);
  });

  it('a currency missing from the payload shows 0 and zero contracts', async () => {
    session('gc.viewer');
    vi.spyOn(gcService, 'dashboard').mockResolvedValue(
      payload({ valueTotals: [{ currency: 'LAK', amount: 900, count: 2 }] }),
    );
    render(<GcDashboardView />);
    const usd = (await screen.findByText(lo.gc.dashboard.valueTotal(lo.currency.USD)))
      .parentElement!;
    expect(within(usd).getByText('0', { exact: true })).toBeInTheDocument();
    expect(
      within(usd).getByText(lo.gc.dashboard.contractsCount(0), { exact: true }),
    ).toBeInTheDocument();
    const delta = within(usd).getByText(lo.gc.dashboard.contractsCount(0));
    expect(delta.className).toContain('text-(--text-muted)');
  });

  it('by-type chart uses Lao type labels sorted by count', async () => {
    session('gc.viewer');
    vi.spyOn(gcService, 'dashboard').mockResolvedValue(payload());
    render(<GcDashboardView />);
    await screen.findByText(lo.gc.dashboard.byType);
    expect(screen.getAllByTestId(/^bar-fill-/).map((e) => e.getAttribute('data-testid'))).toEqual([
      'bar-fill-epc',
      'bar-fill-pta',
      'bar-fill-moa',
    ]);
    expect(screen.getByText(lo.gc.types.epc)).toBeInTheDocument();
  });

  it('by-status bar uses Lao GC status labels', async () => {
    session('gc.viewer');
    vi.spyOn(gcService, 'dashboard').mockResolvedValue(payload());
    render(<GcDashboardView />);
    expect(
      await screen.findByRole('img', {
        name: new RegExp(`${lo.gc.status.expiring} 7, ${lo.gc.status.expired} 6`),
      }),
    ).toBeInTheDocument();
  });

  it('lists upcoming contracts from the real mock with links and countdowns', async () => {
    session('gc.viewer');
    render(<GcDashboardView />);
    const heading = await screen.findByText(lo.gc.dashboard.upcoming90);
    const section = heading.closest('section')!;
    const rows = within(section).getAllByRole('listitem');
    const dash = await gcService.dashboard();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(10);
    expect(rows).toHaveLength(dash.upcoming.length);
    const first = dash.upcoming[0]!;
    expect(within(rows[0]!).getByRole('link')).toHaveAttribute('href', `/contracts/${first.id}`);
    expect(rows[0]!.querySelector('[data-tone]')).not.toBeNull();
  });

  it('shows the empty upcoming message', async () => {
    session('gc.viewer');
    vi.spyOn(gcService, 'dashboard').mockResolvedValue(payload());
    render(<GcDashboardView />);
    expect(await screen.findByText(lo.gc.dashboard.noUpcoming)).toBeInTheDocument();
  });

  it('renders a loading skeleton first', () => {
    session('gc.viewer');
    vi.spyOn(gcService, 'dashboard').mockReturnValue(new Promise(() => undefined));
    const { container } = render(<GcDashboardView />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('error state shows a rose alert and retry reloads', async () => {
    session('gc.viewer');
    const user = userEvent.setup();
    vi.spyOn(gcService, 'dashboard').mockRejectedValueOnce({
      status: 500,
      code: 'HTTP_500',
      message: '',
    });
    render(<GcDashboardView />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(lo.errors.server);
    await user.click(within(alert).getByRole('button', { name: lo.common.retry }));
    await screen.findByText(lo.gc.dashboard.byType);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    ['gc.user', true],
    ['gc.viewer', false],
  ])('empty register for %s offers a create link: %s', async (username, canCreate) => {
    session(username);
    vi.spyOn(gcService, 'dashboard').mockResolvedValue(
      payload({
        total: 0,
        byStatus: { pending: 0, active: 0, expiring: 0, expired: 0 },
        byType: [],
        valueTotals: [],
      }),
    );
    render(<GcDashboardView />);
    expect(await screen.findByText(lo.gc.dashboard.emptyRegister)).toBeInTheDocument();
    const create = screen.queryByRole('link', { name: lo.gc.list.create });
    if (canCreate) expect(create).toHaveAttribute('href', '/contracts/new');
    else expect(create).toBeNull();
  });

  it('support card links reuse SUPPORT_CONTACTS', async () => {
    session('gc.viewer');
    vi.spyOn(gcService, 'dashboard').mockResolvedValue(payload());
    render(<GcDashboardView />);
    expect(await screen.findByRole('link', { name: SUPPORT_CONTACTS.phone })).toHaveAttribute(
      'href',
      'tel:+85621000000',
    );
    expect(screen.getByRole('link', { name: SUPPORT_CONTACTS.email })).toHaveAttribute(
      'href',
      `mailto:${SUPPORT_CONTACTS.email}`,
    );
  });
});
