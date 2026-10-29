import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { MOCK_DEPARTMENTS } from '@/features/lookups/mocks/lookups.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import * as exportCsv from '@/lib/utils/export-csv';
import { formatNumber } from '@/lib/utils/number';
import { caseTotalDue } from '../lib/legal-case-mapper';
import { legalCasesMockDb } from '../mocks/legal-cases.mock';
import { useLegalCasesListStore } from '../store/legal-cases-list.store';
import { LegalCasesView } from './legal-cases-view';

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

async function loadedRows() {
  await waitFor(() => expect(useLegalCasesListStore.getState().status).toBe('ready'));
  await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(1));
  return screen.getAllByRole('row');
}

const L = lo.legal.cases.list;

beforeEach(() => {
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  legalCasesMockDb.reset(new Date());
  useLegalCasesListStore.getState().reset();
  nav.search = '';
  nav.replace = vi.fn();
});

describe('LegalCasesView', () => {
  it('renders code + defendant, type, stage badge, total due and recovered with detail links', async () => {
    session('legal.viewer');
    render(<LegalCasesView />);
    const rows = await loadedRows();
    const c = useLegalCasesListStore.getState().items[0];
    const row = rows.find((r) => within(r).queryByText(c.caseCode))!;
    expect(within(row).getByRole('link', { name: c.caseCode })).toHaveAttribute(
      'href',
      `/legal/cases/${c.id}`,
    );
    expect(within(row).getByText(c.defendant)).toBeInTheDocument();
    expect(within(row).getByText(lo.legal.caseTypes[c.caseType])).toBeInTheDocument();
    expect(within(row).getByText(lo.legal.disputeStatus[c.disputeStatus])).toBeInTheDocument();
    const lak = caseTotalDue(c, 'lak');
    if (lak !== null) expect(within(row).getByText(formatNumber(lak) + ' LAK')).toBeInTheDocument();
  });

  it('caseType, department, status chips and the date range update the query', async () => {
    session('legal.viewer');
    const user = userEvent.setup();
    render(<LegalCasesView />);
    await loadedRows();

    await user.click(screen.getByRole('combobox', { name: L.typeFilter }));
    await user.click(await screen.findByRole('option', { name: lo.legal.caseTypes.CRIMINAL }));
    await waitFor(() => expect(useLegalCasesListStore.getState().query.caseType).toBe('CRIMINAL'));

    await user.click(screen.getByRole('combobox', { name: L.departmentFilter }));
    await user.click(await screen.findByRole('option', { name: MOCK_DEPARTMENTS[1].name }));
    await waitFor(() =>
      expect(useLegalCasesListStore.getState().query.departmentId).toBe(MOCK_DEPARTMENTS[1].id),
    );

    await user.click(screen.getByRole('button', { name: lo.legal.disputeStatus.SUPREME }));
    await waitFor(() => expect(useLegalCasesListStore.getState().query.disputeStatus).toBe('SUPREME'));
    expect(useLegalCasesListStore.getState().query.page).toBe(1);

    useLegalCasesListStore.getState().setQuery({ startDate: '2026-01-01', endDate: '2026-12-31' });
    expect(useLegalCasesListStore.getState().query).toMatchObject({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
  });

  it('legal.viewer sees no write controls; legal.editor sees add/edit/delete but not export', async () => {
    session('legal.viewer');
    const { unmount } = render(<LegalCasesView />);
    await loadedRows();
    expect(screen.queryByRole('button', { name: L.add })).toBeNull();
    expect(screen.queryByRole('button', { name: L.exportCsv })).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp('^' + L.delete) })).toBeNull();
    unmount();
    useLegalCasesListStore.getState().reset();

    session('legal.editor');
    render(<LegalCasesView />);
    await loadedRows();
    expect(screen.getByRole('button', { name: L.add })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: new RegExp('^' + L.edit) }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: L.exportCsv })).toBeNull();
  });

  it('legal.user exports every row of the current filter', async () => {
    session('legal.user');
    const user = userEvent.setup();
    render(<LegalCasesView />);
    await loadedRows();
    await user.click(screen.getByRole('button', { name: L.exportCsv }));
    await waitFor(() => expect(exportCsv.downloadCsv).toHaveBeenCalledTimes(1));
    const [name, csv] = vi.mocked(exportCsv.downloadCsv).mock.calls[0];
    expect(name).toMatch(/^EDL_Legal_Cases_/);
    expect(csv.replace(/^﻿/, '').trimEnd().split('\r\n')).toHaveLength(legalCasesMockDb.all().length + 1);
  });

  it('delete confirms and removes the case', async () => {
    session('legal.user');
    const user = userEvent.setup();
    render(<LegalCasesView />);
    await loadedRows();
    const before = legalCasesMockDb.all().length;
    await user.click(screen.getAllByRole('button', { name: new RegExp('^' + L.delete) })[0]);
    await user.click(await screen.findByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(legalCasesMockDb.all()).toHaveLength(before - 1));
  });
});
