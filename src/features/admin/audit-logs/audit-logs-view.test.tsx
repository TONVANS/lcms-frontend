import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminMockDb } from '@/features/admin/mocks/admin.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { useAuditLogsListStore } from './audit-logs-list.store';
import { AuditLogsView } from './audit-logs-view';

const nav = vi.hoisted(() => ({ search: '', replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  usePathname: () => '/admin/audit-logs',
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const L = lo.auditLogs;

beforeEach(() => {
  nav.search = '';
  nav.replace.mockReset();
  installMocks(api, { delay: 0 });
  adminMockDb.reset(new Date());
  useAuditLogsListStore.getState().reset();
  setMockSession('admin', false);
});

describe('AuditLogsView', () => {
  it('shows loading then rows with Lao action labels', async () => {
    render(<AuditLogsView />);
    expect(screen.getByLabelText(lo.common.loading)).toBeInTheDocument();
    const first = adminMockDb.auditLogs()[0];
    expect((await screen.findAllByText(lo.history.actions[first.action])).length).toBeGreaterThan(0);
    expect(screen.getByText(first.ipAddress)).toBeInTheDocument();
  });

  it('shows an error banner with retry for a non-admin', async () => {
    setMockSession('gc.user', false);
    render(<AuditLogsView />);
    expect(await screen.findByText(L.loadError)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.common.retry })).toBeInTheDocument();
  });

  it('filters by action', async () => {
    const user = userEvent.setup();
    render(<AuditLogsView />);
    await screen.findByText(adminMockDb.auditLogs()[0].ipAddress);
    await user.click(screen.getByRole('combobox', { name: L.filterAction }));
    await user.click(await screen.findByRole('option', { name: lo.history.actions.USER_PERMISSION_CHANGE }));
    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1);
      expect(rows.length).toBe(adminMockDb.auditLogs().filter((r) => r.action === 'USER_PERMISSION_CHANGE').length);
    });
  });

  it('filters by userId text', async () => {
    const user = userEvent.setup();
    render(<AuditLogsView />);
    await screen.findByText(adminMockDb.auditLogs()[0].ipAddress);
    const uid = adminMockDb.auditLogs()[0].userId;
    await user.type(screen.getByRole('textbox', { name: L.filterUser }), uid);
    const expected = adminMockDb.auditLogs().filter((r) => r.userId === uid).length;
    await waitFor(() => expect(screen.getAllByRole('row').slice(1)).toHaveLength(Math.min(expected, 20)));
  });

  it('opens a details dialog with old → new values', async () => {
    const user = userEvent.setup();
    render(<AuditLogsView />);
    const upd = adminMockDb.auditLogs().find((r) => r.action === 'UPDATE_CONTRACT')!;
    await screen.findByText(adminMockDb.auditLogs()[0].ipAddress);
    await user.click(screen.getAllByRole('button', { name: new RegExp(L.viewDetails) })[adminMockDb.auditLogs().indexOf(upd)]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('status')).toBeInTheDocument();
    expect(within(dialog).getByText('DRAFT')).toBeInTheDocument();
    expect(within(dialog).getByText('ACTIVE')).toBeInTheDocument();
  });
});
