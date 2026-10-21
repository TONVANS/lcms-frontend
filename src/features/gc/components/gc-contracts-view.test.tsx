import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
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

const all = () => gcMockDb.all();
/** Header row plus data rows, once real data has replaced the loading skeleton. */
async function loadedRows() {
  await screen.findAllByRole('link', { name: /^GC-2026-/ });
  return screen.getAllByRole('row');
}
const searchBox = () => screen.getByRole('searchbox', { name: lo.gc.list.searchLabel });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  gcMockDb.reset(new Date());
  useGcListStore.getState().reset();
  nav.search = '';
  nav.replace = vi.fn();
});

describe('GcContractsView', () => {
  it('viewer sees rows but no create, edit, delete or actions column', async () => {
    session('gc.viewer');
    render(<GcContractsView />);
    expect((await loadedRows()).length).toBeGreaterThan(1);
    expect(screen.queryByRole('button', { name: lo.gc.list.create })).toBeNull();
    expect(screen.queryByRole('link', { name: lo.gc.list.openWizard })).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp(lo.gc.list.edit) })).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp(lo.gc.list.delete) })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: lo.table.actions })).toBeNull();
  });

  it.each(['gc.editor', 'gc.user'])('%s sees edit and delete named by contract number', async (user) => {
    session(user);
    render(<GcContractsView />);
    const first = (await loadedRows())[1]!;
    const no = within(first).getByRole('link').textContent!;
    expect(no).toMatch(/^GC-2026-/);
    expect(within(first).getByRole('button', { name: `${lo.gc.list.edit} ${no}` })).toBeInTheDocument();
    expect(within(first).getByRole('button', { name: `${lo.gc.list.delete} ${no}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.gc.list.create })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lo.gc.list.openWizard })).toHaveAttribute('href', '/contracts/new');
    expect(screen.getByRole('columnheader', { name: lo.table.actions })).toBeInTheDocument();
  });

  it('links the contract number to the detail page', async () => {
    session('gc.viewer');
    render(<GcContractsView />);
    const first = (await loadedRows())[1]!;
    const link = within(first).getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringMatching(/^\/contracts\/gc-\d+$/));
  });

  it('status chip writes to the URL', async () => {
    session('gc.viewer');
    const user = userEvent.setup();
    render(<GcContractsView />);
    await loadedRows();
    await user.click(screen.getByRole('button', { name: lo.gc.status.expiring }));
    expect(nav.replace).toHaveBeenCalledWith('/contracts/list?status=expiring', { scroll: false });
    expect(screen.getByRole('button', { name: lo.gc.status.expiring })).toHaveAttribute('aria-pressed', 'true');
  });

  it('search filters on the server after the debounce', async () => {
    session('gc.viewer');
    const user = userEvent.setup();
    render(<GcContractsView />);
    await loadedRows();
    const target = all()[5]!;
    await user.type(searchBox(), target.contractNo);
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2), { timeout: 3000 });
    expect(screen.getByRole('link', { name: target.contractNo })).toBeInTheDocument();
    expect(nav.replace).toHaveBeenLastCalledWith(
      `/contracts/list?q=${encodeURIComponent(target.contractNo)}`,
      { scroll: false },
    );
  });

  it('mounts with the search box showing the q from the URL', async () => {
    session('gc.viewer');
    nav.search = 'q=edl';
    render(<GcContractsView />);
    await waitFor(() => expect(searchBox()).toHaveValue('edl'));
  });

  it('follows q changes from outside but never overwrites typing in the debounce window', async () => {
    session('gc.viewer');
    nav.search = 'q=edl';
    const user = userEvent.setup();
    const { rerender } = render(<GcContractsView />);
    await waitFor(() => expect(searchBox()).toHaveValue('edl'));

    // Back/forward: an idle box follows the URL.
    nav.search = 'q=foo';
    await act(async () => rerender(<GcContractsView />));
    await waitFor(() => expect(searchBox()).toHaveValue('foo'));

    // Typing in flight wins over a stale store value.
    await user.type(searchBox(), 'x');
    nav.search = 'q=bar';
    await act(async () => rerender(<GcContractsView />));
    expect(searchBox()).toHaveValue('foox');
  });

  it('clearing the box removes q', async () => {
    session('gc.viewer');
    nav.search = 'q=edl';
    const user = userEvent.setup();
    render(<GcContractsView />);
    await waitFor(() => expect(searchBox()).toHaveValue('edl'));
    await user.clear(searchBox());
    await waitFor(() => expect(useGcListStore.getState().query.q).toBeUndefined(), { timeout: 3000 });
    await waitFor(() => expect(nav.replace).toHaveBeenLastCalledWith('/contracts/list', { scroll: false }));
  });

  it('clicking the title header sorts by title through the URL', async () => {
    session('gc.viewer');
    const user = userEvent.setup();
    render(<GcContractsView />);
    await loadedRows();
    await user.click(screen.getByRole('button', { name: lo.gc.fields.title }));
    expect(nav.replace).toHaveBeenCalledWith('/contracts/list?sort=title', { scroll: false });
    expect(screen.getByRole('columnheader', { name: lo.gc.fields.title })).toHaveAttribute('aria-sort', 'ascending');
  });

  it('signed date and end date headers are sortable, other headers are not', async () => {
    session('gc.viewer');
    render(<GcContractsView />);
    await loadedRows();
    expect(screen.getByRole('button', { name: lo.gc.fields.signedDate })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.gc.fields.endDate })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: lo.gc.fields.counterparty })).toBeNull();
  });

  it('clamps a too-deep page to the last page, once', async () => {
    session('gc.viewer');
    nav.search = 'page=99';
    const list = vi.spyOn(gcService, 'list');
    render(<GcContractsView />);
    await loadedRows();
    expect(useGcListStore.getState().query.page).toBe(5);
    expect(nav.replace).toHaveBeenCalledWith('/contracts/list?page=5', { scroll: false });
    expect(list.mock.calls.map((c) => c[0]?.page)).toEqual([99, 5]);
  });

  it('shows the filter suggestion only when filters are active', async () => {
    session('gc.editor');
    nav.search = 'q=zzzz-no-such-contract';
    render(<GcContractsView />);
    expect(await screen.findByText(lo.gc.list.emptyHint)).toBeInTheDocument();
    // header create only: no create action inside the empty state
    expect(screen.getAllByRole('button', { name: lo.gc.list.create })).toHaveLength(1);
  });

  it('empty register: plain title, create action only for users who can create', async () => {
    const empty = { items: [], page: 1, pageSize: 10, total: 0 };
    session('gc.editor');
    vi.spyOn(gcService, 'list').mockResolvedValue(empty);
    const { unmount } = render(<GcContractsView />);
    expect(await screen.findByText(lo.table.noData)).toBeInTheDocument();
    expect(screen.queryByText(lo.gc.list.emptyHint)).toBeNull();
    expect(screen.getAllByRole('button', { name: lo.gc.list.create })).toHaveLength(2);
    unmount();

    useGcListStore.getState().reset();
    session('gc.viewer');
    render(<GcContractsView />);
    expect(await screen.findByText(lo.table.noData)).toBeInTheDocument();
    expect(screen.queryByText(lo.gc.list.emptyHint)).toBeNull();
    expect(screen.queryByRole('button', { name: lo.gc.list.create })).toBeNull();
  });

  it('labels the type and page-size selects visibly', async () => {
    session('gc.viewer');
    render(<GcContractsView />);
    await loadedRows();
    expect(screen.getByRole('combobox', { name: lo.gc.list.typeFilter })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: lo.gc.list.pageSize })).toBeInTheDocument();
    expect(screen.getByText(lo.gc.list.pageSize)).toBeVisible();
  });

  it('uses the status field label for the column header', async () => {
    session('gc.viewer');
    render(<GcContractsView />);
    await loadedRows();
    expect(screen.getByRole('columnheader', { name: lo.gc.fields.status })).toBeInTheDocument();
  });

  describe('search debounce', () => {
    const qWrites = () =>
      nav.replace.mock.calls.map((c) => String(c[0])).filter((u) => u.includes('q='));

    it('writes q once for a burst of typing', async () => {
      session('gc.viewer');
      render(<GcContractsView />);
      await loadedRows();
      vi.useFakeTimers();
      try {
        for (const v of ['a', 'ab', 'abc']) fireEvent.change(searchBox(), { target: { value: v } });
        act(() => {
          vi.advanceTimersByTime(299);
        });
        expect(qWrites()).toHaveLength(0);
        act(() => {
          vi.advanceTimersByTime(1);
        });
        expect(qWrites()).toEqual(['/contracts/list?q=abc']);
      } finally {
        vi.useRealTimers();
      }
    });

    it('writes nothing when unmounted mid-debounce', async () => {
      session('gc.viewer');
      const { unmount } = render(<GcContractsView />);
      await loadedRows();
      vi.useFakeTimers();
      try {
        fireEvent.change(searchBox(), { target: { value: 'abc' } });
        unmount();
        act(() => {
          vi.advanceTimersByTime(1000);
        });
        expect(qWrites()).toHaveLength(0);
        expect(useGcListStore.getState().query.q).toBeUndefined();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('edit saves and refreshes the row with the new title', async () => {
    session('gc.editor');
    const user = userEvent.setup();
    render(<GcContractsView />);
    const first = (await loadedRows())[1]!;
    const no = within(first).getByRole('link').textContent!;
    await user.click(within(first).getByRole('button', { name: `${lo.gc.list.edit} ${no}` }));
    const dialog = await screen.findByRole('dialog');
    const title = within(dialog).getByLabelText(new RegExp(lo.gc.fields.title));
    await user.clear(title);
    await user.type(title, 'Renamed contract');
    await user.click(within(dialog).getByRole('button', { name: lo.gc.form.save }));
    expect(await screen.findByText('Renamed contract')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('delete confirms, removes, toasts and refreshes', async () => {
    session('gc.editor');
    const user = userEvent.setup();
    render(<GcContractsView />);
    const first = (await loadedRows())[1]!;
    const no = within(first).getByRole('link').textContent!;
    await user.click(within(first).getByRole('button', { name: `${lo.gc.list.delete} ${no}` }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(lo.gc.list.deleteDesc(no))).toBeInTheDocument();
    // danger tone: rose gradient on the confirm button
    expect(within(dialog).getByRole('button', { name: lo.confirm.confirm })).toHaveClass('to-rose-700');
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(screen.queryByRole('link', { name: no })).toBeNull());
    expect(toast.success).toHaveBeenCalledWith(lo.gc.list.deleted);
    expect(all().some((c) => c.contractNo === no)).toBe(false);
  });

  it('returns focus to the row delete button when the delete dialog is cancelled', async () => {
    session('gc.editor');
    const user = userEvent.setup();
    render(<GcContractsView />);
    const first = (await loadedRows())[1]!;
    const no = within(first).getByRole('link').textContent!;
    const del = within(first).getByRole('button', { name: `${lo.gc.list.delete} ${no}` });
    await user.click(del);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.cancel }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(del).toHaveFocus();
  });

  it('keeps the dialog open and toasts the error when delete is rejected', async () => {
    session('gc.editor');
    const user = userEvent.setup();
    vi.spyOn(gcService, 'remove').mockRejectedValueOnce({ status: 500, code: 'HTTP_500', message: '' });
    render(<GcContractsView />);
    const first = (await loadedRows())[1]!;
    const no = within(first).getByRole('link').textContent!;
    await user.click(within(first).getByRole('button', { name: `${lo.gc.list.delete} ${no}` }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(lo.errors.server));
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: no, hidden: true })).toBeInTheDocument();
  });

  it('error state offers retry', async () => {
    session('gc.viewer');
    const user = userEvent.setup();
    vi.spyOn(gcService, 'list').mockRejectedValueOnce({ status: 500, code: 'HTTP_500', message: '' });
    render(<GcContractsView />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(lo.errors.server);
    await user.click(within(alert).getByRole('button', { name: lo.common.retry }));
    expect((await loadedRows()).length).toBeGreaterThan(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
