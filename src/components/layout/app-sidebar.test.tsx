import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { lo } from '@/lib/i18n/lo';
import { AppSidebar } from './app-sidebar';

const nav = vi.hoisted(() => ({ pathname: '/ppa/contracts' }));

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const byName = (username: string) => MOCK_USERS.find((u) => u.username === username)!;

describe('AppSidebar', () => {
  beforeEach(() => {
    nav.pathname = '/ppa/contracts';
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
  });

  it('overrides the focus ring with gold on the navy surface', () => {
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    const { container } = render(<AppSidebar module="ppa" />);
    expect(container.querySelector('aside')).toHaveClass('[--focus-ring:#d4b37a]');
  });

  it('marks the active item with aria-current', () => {
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    render(<AppSidebar module="ppa" />);
    expect(screen.getByRole('link', { name: lo.nav.contracts })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: lo.nav.dashboard })).not.toHaveAttribute('aria-current');
  });

  it('hides the module switcher for a single-module user', () => {
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    render(<AppSidebar module="ppa" />);
    expect(screen.queryByText(lo.modules.gc)).toBeNull();
    expect(screen.queryByText(lo.modules.legal)).toBeNull();
  });

  it('hides the create item from a gc viewer and shows it to a gc editor', () => {
    useAuthStore.setState({ user: byName('gc.viewer'), status: 'authenticated' });
    const { unmount } = render(<AppSidebar module="gc" />);
    expect(screen.queryByRole('link', { name: lo.nav.create })).toBeNull();
    expect(screen.getByRole('link', { name: lo.nav.contracts })).toBeInTheDocument();
    unmount();

    useAuthStore.setState({ user: byName('gc.editor'), status: 'authenticated' });
    render(<AppSidebar module="gc" />);
    expect(screen.getByRole('link', { name: lo.nav.create })).toBeInTheDocument();
  });

  it('shows the module switcher for multi-module users', () => {
    useAuthStore.setState({
      user: { ...byName('gc.user'), accessibleModules: ['power-contracts', 'contracts', 'support'] },
      status: 'authenticated',
    });
    render(<AppSidebar module="ppa" />);
    expect(screen.getByText(lo.modules.gc)).toBeInTheDocument();
    expect(screen.queryByText(lo.modules.legal)).toBeNull();
  });

  it('admin sees all three modules as dropdowns with sub-menu items', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ user: byName('admin'), status: 'authenticated' });
    render(<AppSidebar module="ppa" />);

    // Admin sees all 3 module dropdown buttons
    expect(screen.getByRole('button', { name: new RegExp(lo.modules.ppa) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(lo.modules.gc) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(lo.modules.legal) })).toBeInTheDocument();

    // PPA is open by default (active module / pathname), sub-items visible
    expect(screen.getByRole('link', { name: lo.nav.contracts })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lo.nav.create })).toBeInTheDocument();

    // Toggle GC dropdown to expand its sub-items
    const gcButton = screen.getByRole('button', { name: new RegExp(lo.modules.gc) });
    expect(gcButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(gcButton);
    expect(gcButton).toHaveAttribute('aria-expanded', 'true');

    // Both PPA and GC create items are visible to admin
    const createLinks = screen.getAllByRole('link', { name: lo.nav.create });
    expect(createLinks).toHaveLength(2);
    expect(createLinks.map((l) => l.getAttribute('href'))).toEqual(['/ppa/new', '/contracts/new']);
  });

  it('auto-expands a module dropdown when the pathname changes into it', () => {
    useAuthStore.setState({ user: byName('admin'), status: 'authenticated' });
    const { rerender } = render(<AppSidebar />);
    const gcButton = screen.getByRole('button', { name: new RegExp(lo.modules.gc) });
    expect(gcButton).toHaveAttribute('aria-expanded', 'false');

    nav.pathname = '/contracts';
    rerender(<AppSidebar />);
    expect(screen.getByRole('button', { name: new RegExp(lo.modules.gc) })).toHaveAttribute('aria-expanded', 'true');
  });
});
