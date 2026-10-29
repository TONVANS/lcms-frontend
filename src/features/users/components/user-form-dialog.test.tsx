import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { usersService } from '../api/users.service';
import { usersMockDb } from '../mocks/users.mock';
import { DIVISIONS } from '../types';
import { UserFormDialog } from './user-form-dialog';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const F = lo.users.form;
const P = lo.users.permissions;

function setup(user?: Awaited<ReturnType<typeof usersService.get>>) {
  const onSaved = vi.fn();
  const onOpenChange = vi.fn();
  render(<UserFormDialog open onOpenChange={onOpenChange} user={user} onSaved={onSaved} />);
  return { onSaved, onOpenChange };
}

async function pickRole(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole('combobox', { name: new RegExp(F.role) }));
  await user.click(await screen.findByRole('option', { name: label }));
}

beforeEach(() => {
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  usersMockDb.reset();
  clearMockSession();
  setMockSession('admin', false);
});

describe('UserFormDialog (create)', () => {
  it('shows a required error and does not call the service', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(usersService, 'create');
    setup();
    await user.click(screen.getByRole('button', { name: F.save }));
    expect(await screen.findByText(lo.users.validation.required)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('autofills from HRM', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(new RegExp(F.employeeCode)), 'EDL-001');
    await user.click(screen.getByRole('button', { name: F.hrmLookup }));
    await waitFor(() => expect(screen.getByLabelText(new RegExp(F.fullName))).toHaveValue('ທ້າວ ສົມສັກ ສີສຸວັນ'));
    expect(screen.getByLabelText(new RegExp(F.email))).toHaveValue('somsak@edl.com.la');
    expect(screen.getByLabelText(new RegExp(F.department))).toHaveValue('ຫ້ອງການສຳນັກງານໃຫຍ່');
    expect(screen.getByRole('combobox', { name: new RegExp(F.division) })).toHaveTextContent(DIVISIONS[0]);
  });

  it('shows a non-blocking notice when HRM fails and keeps inputs editable', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(new RegExp(F.employeeCode)), 'NOPE');
    await user.click(screen.getByRole('button', { name: F.hrmLookup }));
    expect(await screen.findByText(F.hrmFailed)).toBeInTheDocument();
    const name = screen.getByLabelText(new RegExp(F.fullName));
    expect(name).toBeEnabled();
    await user.type(name, 'Manual');
    expect(name).toHaveValue('Manual');
  });

  it('implies and locks every permission for ADMIN and MAIN_USER', async () => {
    const user = userEvent.setup();
    setup();
    const upload = () => screen.getByRole('checkbox', { name: P.canUpload });
    expect(upload()).toBeEnabled();
    expect(upload()).not.toBeChecked();
    await pickRole(user, lo.roles.ADMIN);
    expect(upload()).toBeDisabled();
    expect(upload()).toBeChecked();
    expect(screen.getByText(F.permissionsImplied)).toBeInTheDocument();
    await pickRole(user, lo.roles.EDITOR);
    expect(upload()).toBeEnabled();
  });

  it('creates a user with the chosen role and flags', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(usersService, 'create');
    const { onSaved } = setup();
    await user.type(screen.getByLabelText(new RegExp(F.employeeCode)), 'NEW-77');
    await user.type(screen.getByLabelText(new RegExp(F.fullName)), 'Somebody');
    await pickRole(user, lo.roles.EDITOR);
    await user.click(screen.getByRole('checkbox', { name: P.canEdit }));
    await user.click(screen.getByRole('button', { name: F.save }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith({
      employeeCode: 'NEW-77',
      fullName: 'Somebody',
      role: 'EDITOR',
      canView: true,
      canUpload: false,
      canEdit: true,
      canDelete: false,
      canDownload: false,
    });
    expect(toast.success).toHaveBeenCalledWith(F.created);
  });

  it('shows the 409 message for a duplicate employee code', async () => {
    const user = userEvent.setup();
    const { onSaved } = setup();
    await user.type(screen.getByLabelText(new RegExp(F.employeeCode)), 'EMP1001');
    await user.type(screen.getByLabelText(new RegExp(F.fullName)), 'Dup');
    await user.click(screen.getByRole('button', { name: F.save }));
    expect(await screen.findByText(F.duplicate)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('shows a server 400 message in a banner', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(new RegExp(F.employeeCode)), 'ZZ-9');
    await user.click(screen.getByRole('button', { name: F.save }));
    expect(await screen.findByText(/fullName should not be empty/)).toBeInTheDocument();
  });
});

describe('UserFormDialog (edit)', () => {
  it('sends only changed fields', async () => {
    const user = userEvent.setup();
    const target = await usersService.get('u-4');
    const update = vi.spyOn(usersService, 'update');
    const { onSaved } = setup(target);
    expect(screen.getByLabelText(new RegExp(F.employeeCode))).toBeDisabled();
    await pickRole(user, lo.roles.EDITOR);
    await user.click(screen.getByRole('button', { name: F.save }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith('u-4', { role: 'EDITOR' });
  });
});
