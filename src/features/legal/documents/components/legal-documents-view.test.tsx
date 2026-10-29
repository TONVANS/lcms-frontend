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
import { legalDocumentsMockDb } from '../mocks/legal-documents.mock';
import { useLegalDocumentsListStore } from '../store/legal-documents-list.store';
import { LegalDocumentsView } from './legal-documents-view';

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

async function loadedRows() {
  await waitFor(() => expect(useLegalDocumentsListStore.getState().status).toBe('ready'));
  await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(1));
  return screen.getAllByRole('row');
}

const L = lo.legal.regulations.list;

beforeEach(() => {
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  legalDocumentsMockDb.reset(new Date());
  useLegalDocumentsListStore.getState().reset();
  nav.search = '';
  nav.replace = vi.fn();
});

describe('LegalDocumentsView', () => {
  it('renders title + number/date, type label, year, department and status badge with detail links', async () => {
    session('legal.viewer');
    render(<LegalDocumentsView />);
    const rows = await loadedRows();
    const doc = useLegalDocumentsListStore.getState().items[0];
    const row = rows[1];
    const link = within(row).getByRole('link', { name: doc.docTitle });
    expect(link).toHaveAttribute('href', `/legal/regulations/${doc.id}`);
    expect(within(row).getByText(doc.docNumberDate)).toBeInTheDocument();
    expect(within(row).getByText(lo.legal.docTypes[doc.docType])).toBeInTheDocument();
    expect(within(row).getByText(String(doc.issueYear))).toBeInTheDocument();
    expect(within(row).getByText(doc.department!.name)).toBeInTheDocument();
    expect(within(row).getByText(lo.legal.docStatus[doc.status])).toBeInTheDocument();
  });

  it('has no sortable column headers (Ruling 8)', async () => {
    session('legal.viewer');
    render(<LegalDocumentsView />);
    await loadedRows();
    expect(screen.queryAllByRole('columnheader').some((h) => h.getAttribute('aria-sort'))).toBe(false);
  });

  it('docType, year, department select and status chip filters update the query', async () => {
    session('legal.viewer');
    const user = userEvent.setup();
    render(<LegalDocumentsView />);
    await loadedRows();

    await user.click(screen.getByRole('combobox', { name: L.typeFilter }));
    await user.click(await screen.findByRole('option', { name: lo.legal.docTypes.MANUAL }));
    await waitFor(() => expect(useLegalDocumentsListStore.getState().query.docType).toBe('MANUAL'));

    await user.click(screen.getByRole('combobox', { name: L.yearFilter }));
    await user.click(await screen.findByRole('option', { name: '2020' }));
    await waitFor(() => expect(useLegalDocumentsListStore.getState().query.issueYear).toBe(2020));

    await user.click(screen.getByRole('combobox', { name: L.departmentFilter }));
    await user.click(await screen.findByRole('option', { name: MOCK_DEPARTMENTS[2].name }));
    await waitFor(() =>
      expect(useLegalDocumentsListStore.getState().query.departmentId).toBe(MOCK_DEPARTMENTS[2].id),
    );

    await user.click(screen.getByRole('button', { name: lo.legal.docStatus.INACTIVE }));
    await waitFor(() => expect(useLegalDocumentsListStore.getState().query.status).toBe('INACTIVE'));
    expect(useLegalDocumentsListStore.getState().query.page).toBe(1);
  });

  it('legal.viewer sees no delete, edit, add or export controls', async () => {
    session('legal.viewer');
    render(<LegalDocumentsView />);
    await loadedRows();
    expect(screen.queryByRole('button', { name: new RegExp('^' + L.delete) })).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp('^' + L.edit) })).toBeNull();
    expect(screen.queryByRole('button', { name: L.add })).toBeNull();
    expect(screen.queryByRole('button', { name: L.exportCsv })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: lo.table.actions })).toBeNull();
  });

  it('legal.editor can add, edit and delete but not export', async () => {
    session('legal.editor');
    render(<LegalDocumentsView />);
    await loadedRows();
    expect(screen.getByRole('button', { name: L.add })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: new RegExp('^' + L.edit) }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: new RegExp('^' + L.delete) }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: L.exportCsv })).toBeNull();
  });

  it('legal.user exports every filtered row as CSV', async () => {
    session('legal.user');
    const user = userEvent.setup();
    render(<LegalDocumentsView />);
    await loadedRows();
    await user.click(screen.getByRole('button', { name: lo.legal.docStatus.INACTIVE }));
    await waitFor(() => expect(useLegalDocumentsListStore.getState().query.status).toBe('INACTIVE'));
    await user.click(screen.getByRole('button', { name: L.exportCsv }));
    await waitFor(() => expect(exportCsv.downloadCsv).toHaveBeenCalledTimes(1));
    const [name, csv] = vi.mocked(exportCsv.downloadCsv).mock.calls[0];
    expect(name).toMatch(/^EDL_Legal_Documents_/);
    const inactive = legalDocumentsMockDb.all().filter((d) => d.status === 'INACTIVE').length;
    expect(csv.replace(/^﻿/, '').trimEnd().split('\r\n')).toHaveLength(inactive + 1);
  });

  it('delete asks for confirmation and refreshes the list', async () => {
    session('legal.user');
    const user = userEvent.setup();
    render(<LegalDocumentsView />);
    await loadedRows();
    const before = legalDocumentsMockDb.all().length;
    await user.click(screen.getAllByRole('button', { name: new RegExp('^' + L.delete) })[0]);
    await user.click(await screen.findByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(legalDocumentsMockDb.all()).toHaveLength(before - 1));
  });

  it('shows an error banner with retry when the list fails', async () => {
    session('gc.user');
    render(<LegalDocumentsView />);
    await waitFor(() => expect(useLegalDocumentsListStore.getState().status).toBe('error'));
    expect(await screen.findByRole('button', { name: lo.common.retry })).toBeInTheDocument();
  });
});
