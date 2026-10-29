import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { useNotificationsStore } from '@/features/notifications';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { STATUS_META } from '@/lib/constants/status';
import { lo } from '@/lib/i18n/lo';
import { gcMockDb } from '../mocks/gc.mock';
import { GcAlertsView } from './gc-alerts-view';
import { GcContractDetailView } from './gc-contract-detail-view';
import { GcDashboardView } from './gc-dashboard-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/contracts',
  useSearchParams: () => new URLSearchParams(),
}));

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  installMocks(api, { delay: 0 });
  gcMockDb.reset(new Date());
  useNotificationsStore.getState().reset();
});

describe('GcContractDetailView', () => {
  it('shows the fields, status, attachments and history', async () => {
    session('gc.user');
    render(<GcContractDetailView id="gc-001" />);
    const raw = gcMockDb.all()[0];
    expect(await screen.findByRole('heading', { level: 1, name: raw.title })).toBeInTheDocument();
    expect(screen.getByText(STATUS_META.EXPIRING_SOON.label)).toBeInTheDocument();
    expect(screen.getByText(lo.gc.fields.contractNumber)).toBeInTheDocument();
    expect(screen.getByText(raw.contractType.nameLo)).toBeInTheDocument();
    expect(screen.getByText('1,500,000 USD')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: lo.gc.fields.documents })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: lo.gc.detail.history })).toBeInTheDocument();
  });

  it('viewer gets no edit or delete actions', async () => {
    session('gc.viewer');
    render(<GcContractDetailView id="gc-001" />);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: lo.gc.list.edit })).toBeNull();
    expect(screen.queryByRole('button', { name: lo.gc.list.delete })).toBeNull();
  });

  it('editor can edit and delete', async () => {
    session('gc.editor');
    render(<GcContractDetailView id="gc-001" />);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('button', { name: lo.gc.list.edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.gc.list.delete })).toBeInTheDocument();
  });

  it('shows not-found for an unknown id', async () => {
    session('gc.viewer');
    render(<GcContractDetailView id="nope" />);
    expect(await screen.findByText(lo.gc.detail.notFound)).toBeInTheDocument();
  });
});

describe('GcDashboardView', () => {
  it('shows total, expiring soon and expired KPIs from the backend dashboard', async () => {
    session('gc.viewer');
    render(<GcDashboardView />);
    const all = gcMockDb.all();
    const total = await screen.findByText(lo.gc.dashboard.kpiTotal);
    expect(total.closest('a')).toHaveTextContent(String(all.length));
    const exp = document.querySelector('a[href="/contracts/list?status=EXPIRING_SOON"]')!;
    expect(exp).toHaveTextContent(lo.gc.dashboard.kpiExpiring);
    expect(exp).toHaveTextContent(String(all.filter((c) => c.status === 'EXPIRING_SOON').length));
    expect(exp).toHaveAttribute('href', '/contracts/list?status=EXPIRING_SOON');
    const expired = document.querySelector('a[href="/contracts/list?status=EXPIRED"]')!;
    expect(expired).toHaveTextContent(lo.gc.dashboard.kpiExpired);
    expect(expired).toHaveTextContent(String(all.filter((c) => c.status === 'EXPIRED').length));
    expect(screen.getByText(lo.gc.dashboard.valueTotal(lo.currency.USD))).toBeInTheDocument();
    expect(screen.getByText(lo.gc.dashboard.byType)).toBeInTheDocument();
    expect(screen.getByText(lo.gc.dashboard.byStatus)).toBeInTheDocument();
  });
});

describe('GcAlertsView', () => {
  it('lists expiring and expired contracts plus contract notifications with mark-read', async () => {
    const user = userEvent.setup();
    session('gc.viewer');
    render(<GcAlertsView />);
    const expiringHeading = await screen.findByRole('heading', { name: lo.gc.alerts.expiringSection });
    const expiringSection = expiringHeading.closest('section')!;
    const nExpiring = gcMockDb.all().filter((c) => c.status === 'EXPIRING_SOON').length;
    expect(within(expiringSection).getAllByRole('listitem')).toHaveLength(nExpiring);
    expect(screen.getByRole('heading', { name: lo.gc.alerts.expiredSection })).toBeInTheDocument();

    const notifHeading = await screen.findByRole('heading', { name: lo.gc.alerts.notificationsSection });
    const marks = within(notifHeading.closest('section')!).getAllByRole('button', {
      name: new RegExp(lo.gc.alerts.markRead),
    });
    const before = marks.length;
    await user.click(marks[0]);
    await waitFor(() =>
      expect(
        within(notifHeading.closest('section')!).queryAllByRole('button', { name: new RegExp(lo.gc.alerts.markRead) }),
      ).toHaveLength(before - 1),
    );
  });
});
