import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { usersService } from '../api/users.service';
import { usersMockDb } from '../mocks/users.mock';
import { useUsersListStore } from '../store/users-list.store';
import { UsersView } from './users-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const L = lo.users;

beforeEach(() => {
  vi.restoreAllMocks();
  installMocks(api, { delay: 0 });
  usersMockDb.reset();
  useUsersListStore.getState().reset();
  clearMockSession();
  setMockSession('admin', false);
  useAuthStore.setState({ user: MOCK_USERS.find((u) => u.username === 'admin')!, status: 'authenticated' });
});

describe('UsersView', () => {
  it('renders rows with role, permission summary and status as text', async () => {
    render(<UsersView />);
    const row = (await screen.findByText('EMP1004')).closest('tr')!;
    expect(within(row).getByText(L.permissions.canView)).toBeInTheDocument();
    expect(within(row).getByText(lo.roles.VIEWER)).toBeInTheDocument();
    expect(within(row).getByText(L.active)).toBeInTheDocument();
    const admin = screen.getByText('EMP1001').closest('tr')!;
    expect(within(admin).getByText(L.permissionAll)).toBeInTheDocument();
  });

  it('shows an inactive status as text', async () => {
    render(<UsersView />);
    await screen.findByText('EMP1001');
    expect(screen.getAllByText(L.inactive).length).toBeGreaterThan(0);
  });

  it('hides delete for the current user but shows it for others', async () => {
    render(<UsersView />);
    await screen.findByText('EMP1001');
    const me = MOCK_USERS.find((u) => u.username === 'admin')!;
    const other = MOCK_USERS.find((u) => u.username === 'gc.viewer')!;
    expect(screen.queryByRole('button', { name: `${L.delete} ${me.fullName}` })).toBeNull();
    expect(screen.getByRole('button', { name: `${L.edit} ${me.fullName}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${L.delete} ${other.fullName}` })).toBeInTheDocument();
  });

  it('deletes after confirmation', async () => {
    const user = userEvent.setup();
    const remove = vi.spyOn(usersService, 'remove');
    render(<UsersView />);
    const other = MOCK_USERS.find((u) => u.username === 'gc.viewer')!;
    await user.click(await screen.findByRole('button', { name: `${L.delete} ${other.fullName}` }));
    await user.click(screen.getByRole('button', { name: L.delete }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith(other.id));
    await waitFor(() => expect(screen.queryByText(other.employeeCode!)).toBeNull());
  });

  it('filters by role through the backend query', async () => {
    const user = userEvent.setup();
    const list = vi.spyOn(usersService, 'list');
    render(<UsersView />);
    await screen.findByText('EMP1001');
    await user.click(screen.getByRole('combobox', { name: L.roleFilter }));
    await user.click(await screen.findByRole('option', { name: lo.roles.EDITOR }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'EDITOR', page: 1 })));
  });

  it('filters by active status', async () => {
    const user = userEvent.setup();
    const list = vi.spyOn(usersService, 'list');
    render(<UsersView />);
    await screen.findByText('EMP1001');
    await user.click(screen.getByRole('button', { name: L.inactive }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ isActive: false })));
  });
});
