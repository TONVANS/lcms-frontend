import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { lo } from '@/lib/i18n/lo';
import { notificationsService } from '../api/notifications.service';
import { useNotificationsStore } from '../store/notifications.store';
import type { AppNotification } from '../types';
import { NotificationsView } from './notifications-view';

const mk = (
  id: string,
  source: 'contracts' | 'power',
  read: boolean,
  extra: Partial<AppNotification> = {},
): AppNotification => ({
  id,
  source,
  title: `Title ${id}`,
  message: `Msg ${id}`,
  contractId: `c-${id}`,
  contractLabel: `LBL-${id}`,
  daysLeft: 12,
  expirationDate: '2026-12-31',
  read,
  createdAt: `2026-10-0${id}T00:00:00Z`,
  ...extra,
});

function signIn(username: string) {
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  useNotificationsStore.getState().reset();
  vi.spyOn(notificationsService, 'list').mockImplementation(async (source) =>
    source === 'contracts'
      ? [mk('1', 'contracts', false), mk('2', 'contracts', true)]
      : [mk('3', 'power', false)],
  );
});

describe('NotificationsView', () => {
  it('shows a skeleton while loading then the items with links and dates', async () => {
    signIn('admin');
    render(<NotificationsView />);
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(await screen.findByText('Title 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LBL-1' })).toHaveAttribute('href', '/contracts/c-1');
    expect(screen.getByRole('link', { name: 'LBL-3' })).toHaveAttribute('href', '/ppa/contracts/c-3');
    expect(screen.getAllByText(/31\/12\/2026/).length).toBeGreaterThan(0);
  });

  it('shows read state as text', async () => {
    signIn('admin');
    render(<NotificationsView />);
    await screen.findByText('Title 1');
    const unreadRow = screen.getByText('Title 1').closest('li')!;
    expect(within(unreadRow).getByText(lo.notifications.unread)).toBeInTheDocument();
    const readRow = screen.getByText('Title 2').closest('li')!;
    expect(within(readRow).getByText(lo.notifications.read)).toBeInTheDocument();
    expect(within(readRow).queryByRole('button')).toBeNull();
  });

  it('only offers source filters for sources the user has', async () => {
    signIn('gc.user');
    render(<NotificationsView />);
    await screen.findByText('Title 1');
    expect(screen.queryByRole('button', { name: lo.notifications.sourcePower })).toBeNull();
    signIn('admin');
  });

  it('filters by source and by unread', async () => {
    signIn('admin');
    const user = userEvent.setup();
    render(<NotificationsView />);
    await screen.findByText('Title 1');
    await user.click(screen.getByRole('button', { name: lo.notifications.sourcePower }));
    expect(screen.queryByText('Title 1')).toBeNull();
    expect(screen.getByText('Title 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: lo.notifications.all }));
    await user.click(screen.getByRole('checkbox', { name: lo.notifications.unreadOnly }));
    expect(screen.queryByText('Title 2')).toBeNull();
    expect(screen.getByText('Title 1')).toBeInTheDocument();
  });

  it('marks one item read', async () => {
    signIn('admin');
    const mark = vi.spyOn(notificationsService, 'markRead').mockResolvedValue();
    const user = userEvent.setup();
    render(<NotificationsView />);
    await screen.findByText('Title 1');
    await user.click(screen.getByRole('button', { name: `${lo.notifications.markRead}: Title 1` }));
    expect(mark).toHaveBeenCalledWith('contracts', '1');
    await waitFor(() =>
      expect(
        within(screen.getByText('Title 1').closest('li')!).getByText(lo.notifications.read),
      ).toBeInTheDocument(),
    );
  });

  it('marks all read', async () => {
    signIn('admin');
    const all = vi.spyOn(notificationsService, 'markAllRead').mockResolvedValue();
    const user = userEvent.setup();
    render(<NotificationsView />);
    await screen.findByText('Title 1');
    await user.click(screen.getByRole('button', { name: lo.notifications.markAllRead }));
    expect(all).toHaveBeenCalledTimes(2);
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
  });

  it('shows an empty state', async () => {
    signIn('admin');
    vi.spyOn(notificationsService, 'list').mockResolvedValue([]);
    render(<NotificationsView />);
    expect(await screen.findByText(lo.notifications.empty)).toBeInTheDocument();
  });

  it('shows an error banner and retries', async () => {
    signIn('admin');
    vi.spyOn(notificationsService, 'list')
      .mockReset()
      .mockRejectedValueOnce({ status: 500, code: 'SERVER', message: 'x' })
      .mockResolvedValue([mk('1', 'contracts', false)]);
    signIn('gc.user');
    const user = userEvent.setup();
    render(<NotificationsView />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: lo.common.retry }));
    expect(await screen.findByText('Title 1')).toBeInTheDocument();
  });
});
