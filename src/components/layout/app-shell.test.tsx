import { render, screen } from '@testing-library/react';
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
    useNotificationsStore.setState({ items: [{ id: 'x' } as never], unreadCount: 1, status: 'ready' } as never);
    unmount();
    expect(useNotificationsStore.getState()).toMatchObject({ items: [], unreadCount: 0, status: 'idle' });
  });

  it('renders the home layout and does not store lastModule for a forbidden module', () => {
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

  it('wraps sidebar and topbar with print:hidden wrappers', () => {
    pathname = '/ppa';
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    render(<AppShell>child</AppShell>);
    const sidebar = screen.getByRole('navigation', { name: lo.nav.mainMenu }).closest('.print\\:hidden');
    expect(sidebar).not.toBeNull();
    const topbar = screen.getByRole('banner').closest('.print\\:hidden');
    expect(topbar).not.toBeNull();
  });
});
