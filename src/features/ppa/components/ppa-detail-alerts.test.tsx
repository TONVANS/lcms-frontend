import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { useNotificationsStore } from '@/features/notifications';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { powerMockDb } from '../mocks/ppa.mock';
import { PpaAlertsView } from './ppa-alerts-view';
import { PpaContractDetailView } from './ppa-contract-detail-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/ppa',
}));

const owner = MOCK_USERS.find((u) => u.username === 'ppa.user')!;
const viewer = { ...owner, id: 'v', role: 'VIEWER' as const, canUpload: false, canEdit: false, canDelete: false, canDownload: false };

function signIn(user: typeof owner) {
  setMockSession(user.username, false);
  useAuthStore.setState({ user, status: 'authenticated' });
}

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  powerMockDb.reset();
  useNotificationsStore.getState().reset();
});

describe('PpaContractDetailView', () => {
  it('shows fields, documents and history with edit/delete for an owner', async () => {
    signIn(owner);
    render(<PpaContractDetailView id="ppa-1" />);
    expect(await screen.findByText('1,088 MW')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nam Theun 2');
    expect(screen.getByText(lo.ppa.detail.documents)).toBeInTheDocument();
    expect(screen.getByText(lo.history.title)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.ppa.list.edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.ppa.list.delete })).toBeInTheDocument();
  });

  it('hides edit/delete for a viewer', async () => {
    signIn(viewer);
    render(<PpaContractDetailView id="ppa-1" />);
    await screen.findByText('1,088 MW');
    expect(screen.queryByRole('button', { name: lo.ppa.list.edit })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: lo.ppa.list.delete })).not.toBeInTheDocument();
  });

  it('shows not found for an unknown id', async () => {
    signIn(owner);
    render(<PpaContractDetailView id="nope" />);
    expect(await screen.findByText(lo.ppa.detail.notFound)).toBeInTheDocument();
  });
});

describe('PpaAlertsView', () => {
  it('lists expiring and expired contracts and power notifications, with mark-read', async () => {
    signIn(owner);
    const user = userEvent.setup();
    render(<PpaAlertsView />);
    const expiring = await screen.findByRole('region', { name: lo.ppa.alerts.expiringSoon });
    expect(await within(expiring).findByText(/Nam Theun 2/)).toBeInTheDocument();
    const expired = screen.getByRole('region', { name: lo.ppa.alerts.expired });
    expect(await within(expired).findByText('PPA-EDL-2008-006', { exact: false })).toBeInTheDocument();

    const list = await screen.findByRole('list', { name: lo.ppa.alerts.notifications });
    const before = useNotificationsStore.getState().items.filter((n) => n.source === 'power' && !n.read).length;
    expect(before).toBeGreaterThan(0);
    await user.click(within(list).getAllByRole('button', { name: new RegExp(lo.notifications.markRead) })[0]);
    await waitFor(() =>
      expect(useNotificationsStore.getState().items.filter((n) => n.source === 'power' && !n.read)).toHaveLength(
        before - 1,
      ),
    );
  });
});
