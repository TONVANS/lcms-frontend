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
import { regulationsService } from '../api/regulations.service';
import { regulationsMockDb } from '../mocks/regulations.mock';
import { useRegulationsListStore } from '../store/regulations-list.store';
import { RegulationsView } from './regulations-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/utils/export-csv', async (orig) => ({
  ...(await orig<typeof import('@/lib/utils/export-csv')>()),
  downloadCsv: vi.fn(),
}));

const nav = vi.hoisted(() => ({ search: '', replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  usePathname: () => '/legal/regulations',
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
  await waitFor(() => expect(useRegulationsListStore.getState().status).toBe('ready'));
  await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(1));
  return screen.getAllByRole('row');
}
const detailLink = (row: HTMLElement) =>
  within(row)
    .getAllByRole('link')
    .find((l) => l.getAttribute('href')?.startsWith('/legal/regulations/'))!;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  regulationsMockDb.reset(new Date());
  useRegulationsListStore.getState().reset();
  nav.search = '';
  nav.replace = vi.fn();
});

describe('RegulationsView', () => {
  it('renders rows with number link to /legal/regulations/<id>, status badge label, link-count chip', async () => {
    session('legal.viewer');
    render(<RegulationsView />);
    const rows = await loadedRows();
    const first = rows[1]!;
    const items = useRegulationsListStore.getState().items;
    const reg = items.find((r) => r.number === detailLink(first).textContent)!;
    expect(reg).toBeDefined();
    expect(detailLink(first)).toHaveAttribute('href', `/legal/regulations/${reg.id}`);
    expect(within(first).getAllByText(lo.legal.regulationStatus[reg.status]).length).toBeGreaterThan(0);

    // a record with two links shows the count chip
    const withLinks = items.find((r) => r.externalLinks.length === 2)!;
    expect(withLinks).toBeDefined();
    const row = rows.find((r) => within(r).queryByText(withLinks.number))!;
    expect(row).toBeDefined();
    expect(
      within(row).getAllByLabelText(lo.legal.regulations.list.linkCount(2)).length,
    ).toBeGreaterThan(0);
  });

  it('type, unit and status filters update the store query', async () => {
    session('legal.viewer');
    const user = userEvent.setup();
    render(<RegulationsView />);
    await loadedRows();

    await user.click(screen.getByRole('combobox', { name: lo.legal.regulations.list.typeFilter }));
    await user.click(await screen.findByRole('option', { name: lo.legal.regulationTypes.notice }));
    await waitFor(() => expect(useRegulationsListStore.getState().query.type).toBe('notice'));

    await user.click(screen.getByRole('combobox', { name: lo.legal.regulations.list.unitFilter }));
    await user.click(await screen.findByRole('option', { name: lo.legal.units.ict }));
    await waitFor(() => expect(useRegulationsListStore.getState().query.unit).toBe('ict'));

    await user.click(screen.getByRole('button', { name: lo.legal.regulationStatus.repealed }));
    await waitFor(() => expect(useRegulationsListStore.getState().query.status).toBe('repealed'));
    expect(useRegulationsListStore.getState().query.page).toBe(1);
  });

  it('legal.viewer sees no delete or export controls', async () => {
    session('legal.viewer');
    render(<RegulationsView />);
    await loadedRows();
    expect(screen.queryByRole('button', { name: new RegExp(lo.legal.regulations.list.delete) })).toBeNull();
    expect(screen.queryByRole('button', { name: lo.legal.regulations.list.exportCsv })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: lo.table.actions })).toBeNull();
  });

  it('legal.editor sees delete but not export', async () => {
    session('legal.editor');
    render(<RegulationsView />);
    const first = (await loadedRows())[1]!;
    const no = detailLink(first).textContent!;
    expect(
      within(first).getByRole('button', { name: `${lo.legal.regulations.list.delete} ${no}` }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: lo.legal.regulations.list.exportCsv })).toBeNull();
  });

  it('legal.user sees export', async () => {
    session('legal.user');
    render(<RegulationsView />);
    await loadedRows();
    expect(screen.getByRole('button', { name: lo.legal.regulations.list.exportCsv })).toBeInTheDocument();
  });

  it("export fetches pageSize 'all' with the current filters and downloads EDL_Legal_Regulations_<stamp>.csv", async () => {
    session('legal.user');
    nav.search = 'status=repealed';
    const user = userEvent.setup();
    const list = vi.spyOn(regulationsService, 'list');
    render(<RegulationsView />);
    await loadedRows();
    list.mockClear();

    await user.click(screen.getByRole('button', { name: lo.legal.regulations.list.exportCsv }));
    await waitFor(() => expect(exportCsv.downloadCsv).toHaveBeenCalledTimes(1));

    expect(list).toHaveBeenCalledTimes(1);
    expect(list.mock.calls[0]![0]).toMatchObject({ page: 1, pageSize: 'all', status: 'repealed' });
    const [filename, csv] = vi.mocked(exportCsv.downloadCsv).mock.calls[0]!;
    expect(filename).toBe(`EDL_Legal_Regulations_${exportCsv.csvStamp()}.csv`);
    const repealed = regulationsMockDb.all().filter((r) => r.status === 'repealed');
    // header + one line per filtered record, not just the visible page
    expect(csv.replace(/^﻿/, '').trimEnd().split('\r\n')).toHaveLength(repealed.length + 1);
  });

  it('toasts when the export fails and downloads nothing', async () => {
    session('legal.user');
    const user = userEvent.setup();
    render(<RegulationsView />);
    await loadedRows();
    vi.spyOn(regulationsService, 'list').mockRejectedValueOnce({
      status: 500,
      code: 'HTTP_500',
      message: '',
    });
    await user.click(screen.getByRole('button', { name: lo.legal.regulations.list.exportCsv }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(lo.errors.server));
    expect(exportCsv.downloadCsv).not.toHaveBeenCalled();
  });

  it('delete asks for confirmation, calls remove, then afterDelete, and shows a toast', async () => {
    session('legal.editor');
    const user = userEvent.setup();
    const remove = vi.spyOn(regulationsService, 'remove');
    render(<RegulationsView />);
    const first = (await loadedRows())[1]!;
    const link = detailLink(first);
    const no = link.textContent!;
    const id = link.getAttribute('href')!.split('/').pop()!;
    const afterDelete = vi.spyOn(useRegulationsListStore.getState(), 'afterDelete');

    await user.click(within(first).getByRole('button', { name: `${lo.legal.regulations.list.delete} ${no}` }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(lo.legal.regulations.list.deleteDesc(no))).toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.confirm }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith(id));
    await waitFor(() => expect(afterDelete).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(lo.legal.regulations.list.deleted);
    expect(regulationsMockDb.get(id)).toBeUndefined();
  });

  it('error state shows a retry that refetches', async () => {
    session('legal.viewer');
    const user = userEvent.setup();
    vi.spyOn(regulationsService, 'list').mockRejectedValueOnce({
      status: 500,
      code: 'HTTP_500',
      message: '',
    });
    render(<RegulationsView />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(lo.errors.server);
    await user.click(within(alert).getByRole('button', { name: lo.common.retry }));
    expect((await loadedRows()).length).toBeGreaterThan(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('legal.viewer sees no add button and no row edit button', async () => {
    session('legal.viewer');
    render(<RegulationsView />);
    await loadedRows();
    expect(screen.queryByRole('button', { name: lo.legal.regulations.list.add })).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp(`^${lo.legal.regulations.list.edit}`) })).toBeNull();
  });

  it("legal.editor's gold add opens the dialog; a row edit opens it prefilled; onSaved refetches the list", async () => {
    session('legal.editor');
    const user = userEvent.setup();
    render(<RegulationsView />);
    const first = (await loadedRows())[1]!;
    const link = detailLink(first);
    const no = link.textContent!;
    const reg = regulationsMockDb.get(link.getAttribute('href')!.split('/').pop()!)!;

    await user.click(screen.getByRole('button', { name: lo.legal.regulations.list.add }));
    let dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(lo.legal.regulations.form.createTitle);
    await user.click(within(dialog).getByRole('button', { name: lo.legal.regulations.form.cancel }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await user.click(within(first).getByRole('button', { name: `${lo.legal.regulations.list.edit} ${no}` }));
    dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(lo.legal.regulations.form.editTitle);
    expect(within(dialog).getByLabelText(new RegExp(lo.legal.fields.title))).toHaveValue(reg.title);

    const list = vi.spyOn(regulationsService, 'list');
    await user.type(within(dialog).getByLabelText(new RegExp(lo.legal.fields.title)), ' X');
    await user.click(within(dialog).getByRole('button', { name: lo.legal.regulations.form.save }));
    await waitFor(() => expect(list).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(regulationsMockDb.get(reg.id)!.title).toBe(`${reg.title} X`);
  });

  it('sortable headers: number, issued date and title only', async () => {
    session('legal.viewer');
    render(<RegulationsView />);
    await loadedRows();
    expect(screen.getByRole('button', { name: lo.legal.fields.number })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.legal.fields.issuedDate })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.legal.fields.title })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: lo.legal.fields.year })).toBeNull();
  });
});
