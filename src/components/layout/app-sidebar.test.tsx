import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { lo } from '@/lib/i18n/lo';
import { AppSidebar } from './app-sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/ppa/contracts',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const byName = (username: string) => MOCK_USERS.find((u) => u.username === username)!;

describe('AppSidebar', () => {
  beforeEach(() => {
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
    useAuthStore.setState({ user: byName('multi.user'), status: 'authenticated' });
    render(<AppSidebar module="ppa" />);
    expect(screen.getByText(lo.modules.gc)).toBeInTheDocument();
    expect(screen.queryByText(lo.modules.legal)).toBeNull();
  });
});
