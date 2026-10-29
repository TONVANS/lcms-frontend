import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationsService, useNotificationsStore } from '@/features/notifications';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { lo } from '@/lib/i18n/lo';
import { useUiStore } from '@/stores/ui.store';
import { AppShell } from './app-shell';

let pathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const byName = (n: string) => MOCK_USERS.find((u) => u.username === n)!;

beforeEach(() => {
  pathname = '/';
  vi.restoreAllMocks();
  vi.spyOn(notificationsService, 'list').mockResolvedValue([]);
  useNotificationsStore.getState().reset();
  useUiStore.setState({ lastModule: null });
});

describe('AppShell', () => {
  it('resets the notifications store on unmount', () => {
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    const { unmount } = render(<AppShell>child</AppShell>);
    useNotificationsStore.setState({
      items: [{ id: 'x' } as never],
      unreadCount: 1,
      status: 'ready',
    } as never);
    unmount();
    expect(useNotificationsStore.getState()).toMatchObject({
      items: [],
      unreadCount: 0,
      status: 'idle',
    });
  });

  it('hides the sidebar on a forbidden module and does not store lastModule', () => {
    pathname = '/legal';
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    render(<AppShell>child</AppShell>);
    expect(screen.queryByRole('navigation', { name: lo.nav.mainMenu })).toBeNull();
    expect(useUiStore.getState().lastModule).not.toBe('legal');
  });

  it('renders the module sidebar and sets lastModule for an accessible module', () => {
    pathname = '/ppa';
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    render(<AppShell>child</AppShell>);
    expect(screen.getByRole('navigation', { name: lo.nav.mainMenu })).toBeInTheDocument();
    expect(useUiStore.getState().lastModule).toBe('ppa');
  });

  it.each(['/', '/notifications', '/support', '/admin/users'])(
    'shows the sidebar on %s for a non-admin',
    (p) => {
      pathname = p;
      useAuthStore.setState({ user: byName('gc.user'), status: 'authenticated' });
      render(<AppShell>child</AppShell>);
      expect(screen.getByRole('navigation', { name: lo.nav.mainMenu })).toBeInTheDocument();
    },
  );

  it('wraps sidebar and topbar with print:hidden wrappers', () => {
    pathname = '/ppa';
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    render(<AppShell>child</AppShell>);
    const sidebar = screen
      .getByRole('navigation', { name: lo.nav.mainMenu })
      .closest('.print\\:hidden');
    expect(sidebar).not.toBeNull();
    const topbar = screen.getByRole('banner').closest('.print\\:hidden');
    expect(topbar).not.toBeNull();
  });

  it('opens the sidebar in a sheet from the menu button', async () => {
    pathname = '/ppa';
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    render(<AppShell>child</AppShell>);
    expect(screen.queryByRole('dialog')).toBeNull();
    const btn = screen.getByRole('button', { name: lo.topbar.menu });
    await userEvent.click(btn);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('navigation', { name: lo.nav.mainMenu })).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the sheet on navigation', async () => {
    pathname = '/ppa';
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    const { rerender } = render(<AppShell>child</AppShell>);
    await userEvent.click(screen.getByRole('button', { name: lo.topbar.menu }));
    await screen.findByRole('dialog');
    pathname = '/ppa/contracts';
    rerender(<AppShell>child</AppShell>);
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
