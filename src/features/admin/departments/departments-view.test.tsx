import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminMockDb } from '@/features/admin/mocks/admin.mock';
import { useLookupsStore } from '@/features/lookups';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { DepartmentsView } from './departments-view';

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastMock }));

const L = lo.departments;
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FIRST = 'ຫ້ອງການ ຝ່າຍກົດໝາຍ ແລະ ສັນຍາ';
const FREE = 'ຫ້ອງການ ຝ່າຍບໍລິການລູກຄ້າ';

beforeEach(() => {
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  adminMockDb.reset(new Date());
  setMockSession('admin', false);
  useLookupsStore.getState().reset();
});

describe('DepartmentsView', () => {
  it('lists departments with name, code and status', async () => {
    render(<DepartmentsView />);
    expect(await screen.findByText(FIRST)).toBeInTheDocument();
    expect(screen.getByText('LEG')).toBeInTheDocument();
  });

  it('shows the error banner for a forbidden caller', async () => {
    setMockSession('gc.user', false);
    render(<DepartmentsView />);
    expect(await screen.findByText(L.loadError)).toBeInTheDocument();
  });

  it('requires a name', async () => {
    const user = userEvent.setup();
    render(<DepartmentsView />);
    await screen.findByText(FIRST);
    await user.click(screen.getByRole('button', { name: L.add }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: L.form.save }));
    expect(await within(dialog).findByText(L.form.required)).toBeInTheDocument();
  });

  it('creates a department, toasts and refreshes lookups', async () => {
    const user = userEvent.setup();
    render(<DepartmentsView />);
    await screen.findByText(FIRST);
    await user.click(screen.getByRole('button', { name: L.add }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(new RegExp(esc(L.form.name))), 'ພະແນກທົດສອບ');
    await user.type(within(dialog).getByLabelText(new RegExp(esc(L.form.code))), 'TST');
    await user.click(within(dialog).getByRole('button', { name: L.form.save }));
    expect(await screen.findByText('ພະແນກທົດສອບ')).toBeInTheDocument();
    expect(toastMock.success).toHaveBeenCalledWith(L.form.saved);
    await waitFor(() =>
      expect(useLookupsStore.getState().departments.items.some((d) => d.name === 'ພະແນກທົດສອບ')).toBe(true),
    );
  });

  it('shows the 409 message for a duplicate code', async () => {
    const user = userEvent.setup();
    render(<DepartmentsView />);
    await screen.findByText(FIRST);
    await user.click(screen.getByRole('button', { name: L.add }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(new RegExp(esc(L.form.name))), 'ຊື່ໃໝ່');
    await user.type(within(dialog).getByLabelText(new RegExp(esc(L.form.code))), 'LEG');
    await user.click(within(dialog).getByRole('button', { name: L.form.save }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('ມີຢູ່ແລ້ວ');
  });

  it('edits a department', async () => {
    const user = userEvent.setup();
    render(<DepartmentsView />);
    await screen.findByText(FREE);
    await user.click(screen.getByRole('button', { name: L.editAria(FREE) }));
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByLabelText(new RegExp(esc(L.form.name)));
    await user.clear(input);
    await user.type(input, 'ຊື່ແກ້ໄຂ');
    await user.click(within(dialog).getByRole('button', { name: L.form.save }));
    expect(await screen.findByText('ຊື່ແກ້ໄຂ')).toBeInTheDocument();
  });

  it('deletes a free department', async () => {
    const user = userEvent.setup();
    render(<DepartmentsView />);
    await screen.findByText(FREE);
    await user.click(screen.getByRole('button', { name: L.deleteAria(FREE) }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: L.delete }));
    await waitFor(() => expect(screen.queryByText(FREE)).not.toBeInTheDocument());
    expect(toastMock.success).toHaveBeenCalledWith(L.deleted);
  });

  it('shows the server message when the department is bound', async () => {
    const user = userEvent.setup();
    render(<DepartmentsView />);
    await screen.findByText(FIRST);
    await user.click(screen.getByRole('button', { name: L.deleteAria(FIRST) }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: L.delete }));
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('ຖືກນຳໃຊ້ຢູ່'));
    expect(screen.getByText(FIRST)).toBeInTheDocument();
  });

  it('syncs from HRM, toasts the counts, reloads and refreshes lookups', async () => {
    const user = userEvent.setup();
    render(<DepartmentsView />);
    await screen.findByText(FIRST);
    await user.click(screen.getByRole('button', { name: L.sync }));
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith(L.syncDoneCounts(2, 3)));
    expect(await screen.findByText('RND')).toBeInTheDocument();
    await waitFor(() => expect(useLookupsStore.getState().departments.status).toBe('ready'));
  });

  it('toasts an error when sync fails', async () => {
    const user = userEvent.setup();
    render(<DepartmentsView />);
    await screen.findByText(FIRST);
    setMockSession('gc.user', false);
    await user.click(screen.getByRole('button', { name: L.sync }));
    await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
  });
});
