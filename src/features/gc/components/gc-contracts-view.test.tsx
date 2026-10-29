import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { useLookupsStore } from '@/features/lookups';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { STATUS_META } from '@/lib/constants/status';
import { lo } from '@/lib/i18n/lo';
import { gcService } from '../api/gc.service';
import { gcMockDb } from '../mocks/gc.mock';
import { useGcListStore } from '../store/gc-list.store';
import { GcContractsView } from './gc-contracts-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const nav = vi.hoisted(() => ({ search: '', replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  usePathname: () => '/contracts/list',
  useSearchParams: () => new URLSearchParams(nav.search),
}));

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

async function loadedRows() {
  await screen.findAllByRole('link', { name: /^GC-2026-/ });
  return screen.getAllByRole('row');
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  gcMockDb.reset(new Date());
  useGcListStore.getState().reset();
  useLookupsStore.getState().reset();
  nav.search = '';
  nav.replace = vi.fn();
});

describe('GcContractsView', () => {
  it('viewer sees rows and a view action, but no create, edit or delete', async () => {
    session('gc.viewer');
    render(<GcContractsView />);
    expect((await loadedRows()).length).toBeGreaterThan(1);
    expect(screen.queryByRole('button', { name: lo.gc.list.create })).toBeNull();
    expect(screen.queryByRole('link', { name: lo.gc.list.openWizard })).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp(lo.gc.list.edit) })).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp(lo.gc.list.delete) })).toBeNull();
    expect(screen.getAllByRole('link', { name: new RegExp(lo.gc.list.view) }).length).toBeGreaterThan(0);
  });

  it('editor sees create, edit and delete', async () => {
    session('gc.editor');
    render(<GcContractsView />);
    await loadedRows();
    expect(screen.getByRole('button', { name: lo.gc.list.create })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: new RegExp(lo.gc.list.edit) }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: new RegExp(lo.gc.list.delete) }).length).toBeGreaterThan(0);
  });

  it('renders number, title, type, status badge and a countdown only inside the notify window', async () => {
    session('gc.viewer');
    render(<GcContractsView />);
    const rows = await loadedRows();
    const row1 = rows.find((r) => within(r).queryByRole('link', { name: 'GC-2026-001' }))!;
    expect(within(row1).getByText(gcMockDb.all()[0].title)).toBeInTheDocument();
    expect(within(row1).getAllByText(gcMockDb.all()[0].contractType.nameLo).length).toBeGreaterThan(0);
    expect(within(row1).getByText(STATUS_META.EXPIRING_SOON.label)).toBeInTheDocument();
    expect(row1.querySelector('[data-tone]:not([data-slot])')).not.toBeNull();
    // gc-009 expires in 400 days: no countdown badge.
    const row9 = rows.find((r) => within(r).queryByRole('link', { name: 'GC-2026-009' }))!;
    expect(row9.querySelectorAll('[data-tone="planning"],[data-tone="warning"],[data-tone="urgent"]')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /sort/i })).toBeNull();
  });

  it('status chip filters through the service with the backend status value', async () => {
    const user = userEvent.setup();
    session('gc.viewer');
    const spy = vi.spyOn(gcService, 'list');
    render(<GcContractsView />);
    await loadedRows();
    await user.click(screen.getByRole('button', { name: STATUS_META.EXPIRED.label }));
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'EXPIRED' })));
    await waitFor(() => {
      const n = gcMockDb.all().filter((c) => c.status === 'EXPIRED').length;
      expect(screen.getAllByRole('row')).toHaveLength(n + 1);
    });
  });

  it('contract type select filters by contractTypeId', async () => {
    const user = userEvent.setup();
    session('gc.viewer');
    const spy = vi.spyOn(gcService, 'list');
    render(<GcContractsView />);
    await loadedRows();
    await user.click(screen.getByRole('combobox', { name: lo.gc.list.typeFilter }));
    await user.click(await screen.findByRole('option', { name: lo.gc.types.land_lease }));
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ contractTypeId: 3 })));
  });

  it('deletes after confirmation and reports success', async () => {
    const user = userEvent.setup();
    session('gc.editor');
    const del = vi.spyOn(gcService, 'remove');
    render(<GcContractsView />);
    await loadedRows();
    await user.click(screen.getByRole('button', { name: `${lo.gc.list.delete} GC-2026-001` }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('GC-2026-001');
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(del).toHaveBeenCalledWith('gc-001'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(lo.gc.list.deleted));
  });

  it('shows the server error with retry when the list fails', async () => {
    session('gc.viewer');
    vi.spyOn(gcService, 'list').mockRejectedValue({ status: 500, code: 'HTTP_500', message: '' });
    render(<GcContractsView />);
    expect(await screen.findByText(lo.errors.server)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.common.retry })).toBeInTheDocument();
  });
});
