import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import * as exportCsv from '@/lib/utils/export-csv';
import { formatMoney } from '@/lib/utils/money';
import { casesService } from '../api/cases.service';
import { caseTotal } from '../lib/case-money';
import { casesMockDb } from '../mocks/cases.mock';
import { useCasesListStore } from '../store/cases-list.store';
import { CasesView } from './cases-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/utils/export-csv', async (orig) => ({
  ...(await orig<typeof import('@/lib/utils/export-csv')>()),
  downloadCsv: vi.fn(),
}));

const nav = vi.hoisted(() => ({ search: '', replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  usePathname: () => '/legal/cases',
  useSearchParams: () => new URLSearchParams(nav.search),
}));

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

/** Header row plus data rows, once real data has replaced the loading skeleton. */
async function loadedRows() {
  await waitFor(() => expect(useCasesListStore.getState().status).toBe('ready'));
  await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(1));
  return screen.getAllByRole('row');
}

const detailLink = (row: HTMLElement) =>
  within(row)
    .getAllByRole('link')
    .find((l) => l.getAttribute('href')?.startsWith('/legal/cases/'))!;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  casesMockDb.reset(new Date());
  useCasesListStore.getState().reset();
  nav.search = '';
  nav.replace = vi.fn();
});

describe('CasesView', () => {
  it('rows link caseNo to /legal/cases/<id>, show stage badge label, total and recovered with LAK and USD lines', async () => {
    session('legal.viewer');
    render(<CasesView />);
    const rows = await loadedRows();
    const first = rows[1]!;
    const items = useCasesListStore.getState().items;
    const item = items.find((c) => c.caseNo === detailLink(first).textContent)!;
    expect(item).toBeDefined();
    expect(detailLink(first)).toHaveAttribute('href', `/legal/cases/${item.id}`);
    expect(within(first).getAllByText(lo.legal.caseStages[item.stage]).length).toBeGreaterThan(0);

    const totals = caseTotal(item);
    if (totals.lak !== null) {
      expect(within(first).getByText(formatMoney({ amount: totals.lak, currency: 'LAK' }))).toBeInTheDocument();
    }
    if (totals.usd !== null) {
      expect(within(first).getByText(formatMoney({ amount: totals.usd, currency: 'USD' }))).toBeInTheDocument();
    }
    if (item.recovered.lak !== null) {
      expect(within(first).getByText(formatMoney({ amount: item.recovered.lak, currency: 'LAK' }))).toBeInTheDocument();
    }
    if (item.recovered.usd !== null) {
      expect(within(first).getByText(formatMoney({ amount: item.recovered.usd, currency: 'USD' }))).toBeInTheDocument();
    }
  });

  it('stage chips and the in-progress/finished quick filter set stage/progress (mutually exclusive)', async () => {
    session('legal.viewer');
    const user = userEvent.setup();
    render(<CasesView />);
    await loadedRows();

    // Click in_progress quick filter chip
    await user.click(screen.getByRole('button', { name: lo.legal.progress.inProgress }));
    await waitFor(() => {
      expect(useCasesListStore.getState().query.progress).toBe('in_progress');
      expect(useCasesListStore.getState().query.stage).toBeUndefined();
    });

    // Click appeal stage chip - clears progress, sets stage
    await user.click(screen.getByRole('button', { name: lo.legal.caseStages.appeal }));
    await waitFor(() => {
      expect(useCasesListStore.getState().query.stage).toBe('appeal');
      expect(useCasesListStore.getState().query.progress).toBeUndefined();
    });

    // Click finished quick filter - clears stage, sets progress
    await user.click(screen.getByRole('button', { name: lo.legal.progress.finished }));
    await waitFor(() => {
      expect(useCasesListStore.getState().query.progress).toBe('finished');
      expect(useCasesListStore.getState().query.stage).toBeUndefined();
    });

    // Click all chip - clears both
    await user.click(screen.getByRole('button', { name: lo.table.all }));
    await waitFor(() => {
      expect(useCasesListStore.getState().query.stage).toBeUndefined();
      expect(useCasesListStore.getState().query.progress).toBeUndefined();
    });
  });

  it('permission matrix: viewer sees no add, edit, or delete buttons', async () => {
    session('legal.viewer');
    render(<CasesView />);
    await loadedRows();
    expect(screen.queryByRole('button', { name: lo.legal.cases.list.add })).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp(lo.legal.cases.list.delete) })).toBeNull();
    expect(screen.queryByRole('button', { name: lo.legal.cases.list.exportCsv })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: lo.table.actions })).toBeNull();
  });

  it('permission matrix: editor sees add, edit, delete, but not export', async () => {
    session('legal.editor');
    render(<CasesView />);
    const first = (await loadedRows())[1]!;
    const no = detailLink(first).textContent!;
    expect(screen.getByRole('button', { name: lo.legal.cases.list.add })).toBeInTheDocument();
    expect(
      within(first).getByRole('button', { name: `${lo.legal.cases.list.edit} ${no}` }),
    ).toBeInTheDocument();
    expect(
      within(first).getByRole('button', { name: `${lo.legal.cases.list.delete} ${no}` }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: lo.legal.cases.list.exportCsv })).toBeNull();
  });

  it('permission matrix: legal.user sees export', async () => {
    session('legal.user');
    render(<CasesView />);
    await loadedRows();
    expect(screen.getByRole('button', { name: lo.legal.cases.list.exportCsv })).toBeInTheDocument();
  });

  it("export calls list with pageSize 'all' and current filters, then downloads EDL_Legal_Cases_<stamp>.csv", async () => {
    session('legal.user');
    nav.search = 'caseType=civil';
    const user = userEvent.setup();
    const list = vi.spyOn(casesService, 'list');
    render(<CasesView />);
    await loadedRows();
    list.mockClear();

    await user.click(screen.getByRole('button', { name: lo.legal.cases.list.exportCsv }));
    await waitFor(() => expect(exportCsv.downloadCsv).toHaveBeenCalledTimes(1));

    expect(list).toHaveBeenCalledTimes(1);
    expect(list.mock.calls[0]![0]).toMatchObject({ page: 1, pageSize: 'all', caseType: 'civil' });
    const [filename, csv] = vi.mocked(exportCsv.downloadCsv).mock.calls[0]!;
    expect(filename).toBe(`EDL_Legal_Cases_${exportCsv.csvStamp()}.csv`);
    const civil = casesMockDb.all().filter((c) => c.caseType === 'civil');
    expect(csv.replace(/^\uFEFF/, '').trimEnd().split('\r\n')).toHaveLength(civil.length + 1);
  });

  it('print button calls window.print', async () => {
    session('legal.viewer');
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<CasesView />);
    await loadedRows();

    const printBtn = screen.getByRole('button', { name: lo.legal.cases.list.print });
    expect(printBtn).toBeInTheDocument();
    await user.click(printBtn);
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('filters, actions and pagination carry print:hidden', async () => {
    session('legal.editor');
    const { container } = render(<CasesView />);
    await loadedRows();

    const filtersCard = container.querySelector('[data-testid="cases-filters-card"]') ?? container.querySelector('.backdrop-blur-md');
    expect(filtersCard?.className).toContain('print:hidden');

    const printBtn = screen.getByRole('button', { name: lo.legal.cases.list.print });
    expect(printBtn.className).toContain('print:hidden');

    const addBtn = screen.getByRole('button', { name: lo.legal.cases.list.add });
    expect(addBtn.className).toContain('print:hidden');

    const actionsHeader = screen.getByRole('columnheader', { name: lo.table.actions });
    expect(actionsHeader.className).toContain('print:hidden');
  });

  it('delete flow with ConfirmDialog and toast', async () => {
    session('legal.editor');
    const user = userEvent.setup();
    const remove = vi.spyOn(casesService, 'remove');
    render(<CasesView />);
    const first = (await loadedRows())[1]!;
    const link = detailLink(first);
    const no = link.textContent!;
    const id = link.getAttribute('href')!.split('/').pop()!;
    const afterDelete = vi.spyOn(useCasesListStore.getState(), 'afterDelete');

    await user.click(within(first).getByRole('button', { name: `${lo.legal.cases.list.delete} ${no}` }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(lo.legal.cases.list.deleteDesc(no))).toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.confirm }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith(id));
    await waitFor(() => expect(afterDelete).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(lo.legal.cases.list.deleted);
    expect(casesMockDb.get(id)).toBeUndefined();
  });
});
