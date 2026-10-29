import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { supportService } from '../api/support.service';
import { SupportView } from './support-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function signIn(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
});

describe('SupportView', () => {
  it('renders contact links and own tickets for a non-admin, with no admin controls', async () => {
    signIn('gc.user');
    render(<SupportView />);
    expect(await screen.findByRole('link', { name: '+856 21 000 000' })).toHaveAttribute('href', 'tel:+85621000000');
    expect(screen.getByRole('link', { name: 'support@lcms.example' })).toHaveAttribute(
      'href',
      'mailto:support@lcms.example',
    );
    expect(await screen.findByText('ເຂົ້າສູ່ລະບົບບໍ່ໄດ້')).toBeInTheDocument();
    expect(screen.queryByText('ລາຍງານໂຫຼດຊ້າ')).toBeNull(); // admin's ticket
    expect(screen.queryByRole('button', { name: lo.support.addContact })).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp(lo.support.updateTicketFor('').trim()) })).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp(lo.support.deleteContactFor('').trim()) })).toBeNull();
  });

  it('shows admin controls for ADMIN and updates a ticket', async () => {
    signIn('admin');
    const user = userEvent.setup();
    render(<SupportView />);
    expect(await screen.findByRole('button', { name: lo.support.addContact })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: lo.support.updateTicketFor('ເຂົ້າສູ່ລະບົບບໍ່ໄດ້') }));
    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText(lo.support.colStatus), 'CLOSED');
    await user.type(within(dialog).getByLabelText(lo.support.adminNote), 'done');
    await user.click(within(dialog).getByRole('button', { name: lo.support.save }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const t = await supportService.ticket('t-001');
    expect(t).toMatchObject({ status: 'CLOSED', adminNote: 'done' });
  });

  it('validates then creates a ticket', async () => {
    signIn('gc.user');
    const user = userEvent.setup();
    const spy = vi.spyOn(supportService, 'createTicket');
    render(<SupportView />);
    await user.click(await screen.findByRole('button', { name: lo.support.report }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: lo.support.submit }));
    expect(await within(dialog).findByText(lo.support.errors.subjectRequired)).toBeInTheDocument();
    expect(within(dialog).getByText(lo.support.errors.descriptionRequired)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText(lo.support.subject), 'New problem');
    await user.type(within(dialog).getByLabelText(lo.support.descriptionLabel), 'Details');
    await user.selectOptions(within(dialog).getByLabelText(lo.support.priority), 'HIGH');
    await user.click(within(dialog).getByRole('button', { name: lo.support.submit }));
    await waitFor(() => expect(spy).toHaveBeenCalledWith({
      subject: 'New problem',
      description: 'Details',
      priority: 'HIGH',
      file: undefined,
    }));
    expect(await screen.findByText('New problem')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    signIn('admin');
    const user = userEvent.setup();
    render(<SupportView />);
    await screen.findByText('ຕົວອັກສອນຊ້ອນກັນ');
    const spy = vi.spyOn(supportService, 'tickets');
    await user.click(screen.getByRole('button', { name: lo.support.statuses.CLOSED }));
    await waitFor(() => expect(spy).toHaveBeenCalledWith(expect.objectContaining({ status: 'CLOSED', page: 1 })));
    await waitFor(() => expect(screen.queryByText('ຕົວອັກສອນຊ້ອນກັນ')).toBeNull());
    expect(screen.getByText('ເພີ່ມຜູ້ໃຊ້ໃໝ່')).toBeInTheDocument();
  });

  it('shows an error banner with retry when tickets fail', async () => {
    signIn('gc.user');
    vi.spyOn(supportService, 'tickets').mockRejectedValueOnce({ status: 500, code: 'SERVER', message: 'x' });
    render(<SupportView />);
    expect(await screen.findByText(lo.errors.server)).toBeInTheDocument();
  });
});
