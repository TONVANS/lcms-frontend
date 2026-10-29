import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { powerMockDb } from '../mocks/ppa.mock';
import { usePpaListStore } from '../store/ppa-list.store';
import { PpaContractsView } from './ppa-contracts-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/ppa/contracts',
}));

const owner = MOCK_USERS.find((u) => u.username === 'ppa.user')!;
const viewer = {
  ...owner,
  id: 'u-view',
  role: 'VIEWER' as const,
  canUpload: false,
  canEdit: false,
  canDelete: false,
  canDownload: false,
};

function signIn(user: typeof owner) {
  setMockSession(user.username, false);
  useAuthStore.setState({ user, status: 'authenticated' });
}

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  powerMockDb.reset();
  usePpaListStore.getState().reset();
});

describe('PpaContractsView', () => {
  it('renders title, contracts, type and status filter chips without sortable headers', async () => {
    signIn(owner);
    render(<PpaContractsView />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(lo.ppa.title);
    expect(await screen.findByText('PPA-EDL-2010-001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.ppa.types.SALE })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.status.EXPIRING_SOON })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(lo.ppa.fields.expirationDate) })).not.toBeInTheDocument();
  });

  it('shows create/edit/delete for users with permission', async () => {
    signIn(owner);
    render(<PpaContractsView />);
    await screen.findByText('PPA-EDL-2010-001');
    expect(screen.getByRole('button', { name: lo.ppa.list.create })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lo.ppa.list.openWizard })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: new RegExp(`^${lo.ppa.list.edit}`) }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: new RegExp(`^${lo.ppa.list.delete}`) }).length).toBeGreaterThan(0);
  });

  it('hides create/edit/delete for a viewer but keeps view', async () => {
    signIn(viewer);
    render(<PpaContractsView />);
    await screen.findByText('PPA-EDL-2010-001');
    expect(screen.queryByRole('button', { name: lo.ppa.list.create })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: lo.ppa.list.openWizard })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(`^${lo.ppa.list.edit}`) })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(`^${lo.ppa.list.delete}`) })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: new RegExp(`^${lo.ppa.list.view}`) }).length).toBeGreaterThan(0);
  });

  it('filters by contract type chip', async () => {
    signIn(owner);
    const user = userEvent.setup();
    render(<PpaContractsView />);
    await screen.findByText('PPA-EDL-2010-001');
    await user.click(screen.getByRole('button', { name: lo.ppa.types.SALE }));
    await waitFor(() => expect(screen.queryByText('PPA-EDL-2010-001')).not.toBeInTheDocument());
    expect(await screen.findByText('PSA-EDL-2020-001')).toBeInTheDocument();
    expect(usePpaListStore.getState().query.contractType).toBe('SALE');
  });
});
