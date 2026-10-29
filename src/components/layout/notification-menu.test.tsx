import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  notificationsService,
  useNotificationsStore,
  type AppNotification,
} from '@/features/notifications';
import { lo } from '@/lib/i18n/lo';
import { NotificationMenu } from './notification-menu';

const make = (i: number, read: boolean): AppNotification => ({
  id: String(i),
  source: 'contracts',
  title: `Title ${i}`,
  message: null,
  contractId: `c-${i}`,
  contractLabel: `GC-${i}`,
  daysLeft: 10,
  expirationDate: null,
  read,
  createdAt: '2026-03-05T10:00:00Z',
});

function seed(items: AppNotification[]) {
  useNotificationsStore.setState({
    items,
    unreadCount: items.filter((i) => !i.read).length,
    status: 'ready',
  });
}

describe('NotificationMenu', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useNotificationsStore.getState().reset();
  });

  it('labels the trigger with the unread count and shows a numeric badge', () => {
    seed([make(1, false), make(2, false), make(3, true)]);
    render(<NotificationMenu />);
    const btn = screen.getByRole('button', {
      name: `${lo.topbar.notifications}, 2 ${lo.topbar.unread}`,
    });
    expect(within(btn).getByText('2')).toBeInTheDocument();
  });

  it('has a plain label and no badge with zero unread', () => {
    seed([make(1, true)]);
    render(<NotificationMenu />);
    const btn = screen.getByRole('button', { name: lo.topbar.notifications });
    expect(within(btn).queryByText('0')).toBeNull();
  });

  it('lists the latest 5 with contract link, dd/mm/yyyy date and see-all link', async () => {
    seed([1, 2, 3, 4, 5, 6, 7].map((i) => make(i, i % 2 === 0)));
    render(<NotificationMenu />);
    await userEvent.click(
      screen.getByRole('button', { name: new RegExp(lo.topbar.notifications) }),
    );
    const panel = await screen.findByRole('dialog');
    expect(within(panel).getAllByRole('listitem')).toHaveLength(5);
    expect(within(panel).getByText('Title 1')).toBeInTheDocument();
    expect(within(panel).queryByText('Title 6')).toBeNull();
    expect(within(panel).getAllByText('05/03/2026').length).toBeGreaterThan(0);
    expect(within(panel).getByRole('link', { name: 'GC-1' })).toHaveAttribute(
      'href',
      '/contracts/c-1',
    );
    expect(within(panel).getByRole('link', { name: lo.topbar.seeAll })).toHaveAttribute(
      'href',
      '/notifications',
    );
    expect(within(panel).getAllByText(lo.notifications.unread).length).toBeGreaterThan(0);
  });

  it('marks all read and disables the button when nothing is unread', async () => {
    vi.spyOn(notificationsService, 'markAllRead').mockResolvedValue(undefined as never);
    seed([make(1, false)]);
    render(<NotificationMenu />);
    await userEvent.click(
      screen.getByRole('button', { name: new RegExp(lo.topbar.notifications) }),
    );
    const markAll = await screen.findByRole('button', { name: lo.notifications.markAllRead });
    expect(markAll).toBeEnabled();
    await userEvent.click(markAll);
    await vi.waitFor(() => expect(useNotificationsStore.getState().unreadCount).toBe(0));
    expect(screen.getByRole('button', { name: lo.notifications.markAllRead })).toBeDisabled();
  });

  it('shows the empty state', async () => {
    seed([]);
    render(<NotificationMenu />);
    await userEvent.click(
      screen.getByRole('button', { name: new RegExp(lo.topbar.notifications) }),
    );
    expect(await screen.findByText(lo.notifications.empty)).toBeInTheDocument();
  });
});
