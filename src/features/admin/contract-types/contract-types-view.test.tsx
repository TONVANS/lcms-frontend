import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminMockDb } from '@/features/admin/mocks/admin.mock';
import { useLookupsStore } from '@/features/lookups';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { ContractTypesView } from './contract-types-view';

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastMock }));

const L = lo.contractTypes;
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

beforeEach(() => {
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  adminMockDb.reset(new Date());
  setMockSession('admin', false);
  useLookupsStore.getState().reset();
});

describe('ContractTypesView', () => {
  it('shows a loading state then the list', async () => {
    render(<ContractTypesView />);
    expect(screen.getByLabelText(lo.common.loading)).toBeInTheDocument();
    expect(await screen.findByText(lo.gc.types.epc)).toBeInTheDocument();
  });

  it('shows the error banner with retry for a forbidden caller', async () => {
    setMockSession('gc.user', false);
    render(<ContractTypesView />);
    expect(await screen.findByText(L.loadError)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.common.retry })).toBeInTheDocument();
  });

  it('shows the empty state when search matches nothing', async () => {
    const user = userEvent.setup();
    render(<ContractTypesView />);
    await screen.findByText(lo.gc.types.epc);
    await user.type(screen.getByRole('searchbox', { name: L.searchLabel }), 'zzzz-none');
    expect(await screen.findByText(L.emptyTitle, undefined, { timeout: 8000 })).toBeInTheDocument();
  });

  it('validates required nameLo with the Lao message', async () => {
    const user = userEvent.setup();
    render(<ContractTypesView />);
    await screen.findByText(lo.gc.types.epc);
    await user.click(screen.getByRole('button', { name: L.add }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: L.form.save }));
    expect(await within(dialog).findByText(L.form.required)).toBeInTheDocument();
  });

  it('creates a type, toasts and refreshes the lookups cache', async () => {
    const user = userEvent.setup();
    render(<ContractTypesView />);
    await screen.findByText(lo.gc.types.epc);
    await user.click(screen.getByRole('button', { name: L.add }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(new RegExp(esc(L.form.nameLo))), 'ປະເພດທົດສອບ');
    await user.click(within(dialog).getByRole('button', { name: L.form.save }));
    expect(await screen.findByText('ປະເພດທົດສອບ')).toBeInTheDocument();
    expect(toastMock.success).toHaveBeenCalledWith(L.form.saved);
    await waitFor(() =>
      expect(useLookupsStore.getState().contractTypes.items.some((t) => t.nameLo === 'ປະເພດທົດສອບ')).toBe(true),
    );
  });

  it('shows the server 409 message inside the dialog on duplicates', async () => {
    const user = userEvent.setup();
    render(<ContractTypesView />);
    await screen.findByText(lo.gc.types.epc);
    await user.click(screen.getByRole('button', { name: L.add }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(new RegExp(esc(L.form.nameLo))), lo.gc.types.epc);
    await user.click(within(dialog).getByRole('button', { name: L.form.save }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('ມີຢູ່ແລ້ວ');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('edits a type', async () => {
    const user = userEvent.setup();
    render(<ContractTypesView />);
    await screen.findByText(lo.gc.types.epc);
    await user.click(screen.getByRole('button', { name: L.editAria(lo.gc.types.epc) }));
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByLabelText(new RegExp(esc(L.form.nameLo)));
    await user.clear(input);
    await user.type(input, 'EPC ແກ້ໄຂ');
    await user.click(within(dialog).getByRole('button', { name: L.form.save }));
    expect(await screen.findByText('EPC ແກ້ໄຂ')).toBeInTheDocument();
    expect(screen.queryByText(lo.gc.types.epc)).not.toBeInTheDocument();
  });

  it('deletes an unused type and refreshes lookups', async () => {
    const user = userEvent.setup();
    adminMockDb.setContractTypes([
      ...adminMockDb.contractTypes(),
      { id: 99, nameLo: 'ລຶບໄດ້', nameEn: null, isActive: true },
    ]);
    render(<ContractTypesView />);
    await screen.findByText('ລຶບໄດ້');
    await user.click(screen.getByRole('button', { name: L.deleteAria('ລຶບໄດ້') }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: L.delete }));
    await waitFor(() => expect(screen.queryByText('ລຶບໄດ້')).not.toBeInTheDocument());
    expect(toastMock.success).toHaveBeenCalledWith(L.deleted);
    await waitFor(() => expect(useLookupsStore.getState().contractTypes.status).toBe('ready'));
  });

  it('keeps the dialog open and shows the server message when the type is in use', async () => {
    const user = userEvent.setup();
    render(<ContractTypesView />);
    await screen.findByText(lo.gc.types.om_service);
    await user.click(screen.getByRole('button', { name: L.deleteAria(lo.gc.types.om_service) }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: L.delete }));
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('ຖືກນຳໃຊ້ໃນສັນຍາ'));
    expect(screen.getByText(lo.gc.types.om_service)).toBeInTheDocument();
  });
});

describe('ContractTypesView signed out', () => {
  it('shows the error state', async () => {
    clearMockSession();
    render(<ContractTypesView />);
    expect(await screen.findByText(L.loadError)).toBeInTheDocument();
  });
});
