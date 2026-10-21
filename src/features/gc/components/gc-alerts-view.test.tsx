import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { alertsService, useAlertsStore } from '@/features/alerts';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import type { Alert } from '@/types/domain';
import { gcMockDb } from '../mocks/gc.mock';
import { GcAlertsView } from './gc-alerts-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

function at(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const mk = (id: string, offset: number, read = false): Alert => ({
  id,
  module: 'gc',
  entityType: 'gc-contract',
  entityId: `c-${id}`,
  title: `Title ${id}`,
  dueDate: at(offset),
  daysLeft: offset,
  read,
});

const rowOf = (title: string) => screen.getByRole('link', { name: title }).closest('li')!;
const markLabel = (title: string) => `${lo.gc.alerts.markRead}: ${title}`;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  gcMockDb.reset(new Date());
  useAlertsStore.getState().reset();
});

describe('GcAlertsView', () => {
  it('groups alerts by window in order under an h1', async () => {
    session('gc.user');
    render(<GcAlertsView />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(lo.gc.alerts.title);
    const headings = (await screen.findAllByRole('heading', { level: 2 })).map(
      (h) => h.textContent,
    );
    const order = [
      lo.gc.alerts.groupOverdue,
      lo.gc.alerts.group7,
      lo.gc.alerts.group30,
      lo.gc.alerts.group60,
    ];
    expect(headings).toEqual(order.filter((o) => headings.includes(o)));
    // the seeded bill_collection contract ends in 60 days
    expect(headings).toContain(lo.gc.alerts.group60);
    const section60 = screen
      .getByRole('heading', { level: 2, name: lo.gc.alerts.group60 })
      .closest('section')!;
    expect(within(section60).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('hides empty groups', async () => {
    session('gc.user');
    vi.spyOn(alertsService, 'list').mockResolvedValue([mk('a', 3)]);
    render(<GcAlertsView />);
    await screen.findByRole('link', { name: 'Title a' });
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      lo.gc.alerts.group7,
    ]);
  });

  it('requests only the gc module', async () => {
    session('gc.user');
    const spy = vi.spyOn(alertsService, 'list').mockResolvedValue([]);
    render(<GcAlertsView />);
    await screen.findByText(lo.gc.alerts.empty);
    expect(spy).toHaveBeenCalledWith({ module: 'gc' });
  });

  it('rows link to contract detail and show countdown, due date and unread cue', async () => {
    session('gc.user');
    vi.spyOn(alertsService, 'list').mockResolvedValue([mk('a', 3), mk('b', 10, true)]);
    render(<GcAlertsView />);
    const link = await screen.findByRole('link', { name: 'Title a' });
    expect(link).toHaveAttribute('href', '/contracts/c-a');
    const row = rowOf('Title a');
    expect(row.querySelector('[data-tone]')).not.toBeNull();
    expect(within(row).getByText(new RegExp(at(3).slice(0, 4)))).toBeInTheDocument();
    expect(within(row).getByText(lo.topbar.unread)).toHaveClass('sr-only');
    expect(row.querySelector('[aria-hidden="true"]')).not.toBeNull();
    const readRow = rowOf('Title b');
    expect(within(readRow).queryByText(lo.topbar.unread)).toBeNull();
    expect(within(readRow).queryByRole('button')).toBeNull();
  });

  it('mark read updates the row, refreshes the bell and returns focus to the link', async () => {
    session('gc.user');
    let items = [mk('a', 3), mk('b', 10)];
    vi.spyOn(alertsService, 'list').mockImplementation(async () => items.map((x) => ({ ...x })));
    const markRead = vi.spyOn(alertsService, 'markRead').mockImplementation(async (id) => {
      items = items.map((x) => (x.id === id ? { ...x, read: true } : x));
    });
    await useAlertsStore.getState().fetch();
    expect(useAlertsStore.getState().unreadCount).toBe(2);
    const user = userEvent.setup();
    render(<GcAlertsView />);
    await user.click(await screen.findByRole('button', { name: markLabel('Title a') }));
    expect(markRead).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(within(rowOf('Title a')).queryByText(lo.topbar.unread)).toBeNull();
    });
    expect(within(rowOf('Title a')).queryByRole('button')).toBeNull();
    await waitFor(() => expect(screen.getByRole('link', { name: 'Title a' })).toHaveFocus());
    await waitFor(() => expect(useAlertsStore.getState().unreadCount).toBe(1));
  });

  it('locks the button while pending so a double click sends one request', async () => {
    session('gc.user');
    vi.spyOn(alertsService, 'list').mockResolvedValue([mk('a', 3)]);
    let resolve!: () => void;
    const markRead = vi
      .spyOn(alertsService, 'markRead')
      .mockImplementation(() => new Promise<void>((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<GcAlertsView />);
    const button = await screen.findByRole('button', { name: markLabel('Title a') });
    await user.dblClick(button);
    expect(markRead).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('aria-disabled', 'true');
    resolve();
    await waitFor(() => expect(screen.queryByRole('button')).toBeNull());
  });

  it('failure toasts the error and leaves the row unread', async () => {
    session('gc.user');
    vi.spyOn(alertsService, 'list').mockResolvedValue([mk('a', 3)]);
    vi.spyOn(alertsService, 'markRead').mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<GcAlertsView />);
    await user.click(await screen.findByRole('button', { name: markLabel('Title a') }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const row = rowOf('Title a');
    expect(within(row).getByText(lo.topbar.unread)).toBeInTheDocument();
    expect(within(row).getByRole('button')).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('shows allRead status when nothing is unread, not when something is', async () => {
    session('gc.user');
    const spy = vi.spyOn(alertsService, 'list').mockResolvedValue([mk('a', 3, true)]);
    const { unmount } = render(<GcAlertsView />);
    expect(await screen.findByRole('status')).toHaveTextContent(lo.gc.alerts.allRead);
    unmount();
    spy.mockResolvedValue([mk('a', 3)]);
    render(<GcAlertsView />);
    await screen.findByRole('link', { name: 'Title a' });
    expect(screen.queryByText(lo.gc.alerts.allRead)).toBeNull();
  });

  it('mark-read state persists across a remount (refetch from the server)', async () => {
    session('gc.user');
    const user = userEvent.setup();
    const first = render(<GcAlertsView />);
    const buttons = await screen.findAllByRole('button');
    const label = buttons[0].getAttribute('aria-label')!;
    const title = label.slice(`${lo.gc.alerts.markRead}: `.length);
    await user.click(buttons[0]);
    await waitFor(() => expect(screen.queryByRole('button', { name: label })).toBeNull());
    first.unmount();
    render(<GcAlertsView />);
    await screen.findByRole('link', { name: title });
    expect(screen.queryByRole('button', { name: label })).toBeNull();
    expect(within(rowOf(title)).queryByText(lo.topbar.unread)).toBeNull();
  });

  it('shows a skeleton while loading', () => {
    session('gc.user');
    vi.spyOn(alertsService, 'list').mockReturnValue(new Promise(() => undefined));
    const { container } = render(<GcAlertsView />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('error shows a banner and retry reloads', async () => {
    session('gc.user');
    const spy = vi
      .spyOn(alertsService, 'list')
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValue([mk('a', 3)]);
    const user = userEvent.setup();
    render(<GcAlertsView />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: lo.common.retry }));
    expect(await screen.findByRole('link', { name: 'Title a' })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('empty state when there are no alerts', async () => {
    session('gc.user');
    vi.spyOn(alertsService, 'list').mockResolvedValue([]);
    render(<GcAlertsView />);
    expect(await screen.findByText(lo.gc.alerts.empty)).toBeInTheDocument();
    expect(screen.queryByText(lo.gc.alerts.allRead)).toBeNull();
  });

  it('a gc viewer can mark read', async () => {
    session('gc.viewer');
    vi.spyOn(alertsService, 'list').mockResolvedValue([mk('a', 3)]);
    render(<GcAlertsView />);
    expect(await screen.findByRole('button', { name: markLabel('Title a') })).toBeInTheDocument();
  });
});
