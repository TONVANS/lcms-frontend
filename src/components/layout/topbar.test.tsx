import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { useNotificationsStore } from '@/features/notifications';
import { lo } from '@/lib/i18n/lo';
import { Topbar } from './topbar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

beforeEach(() => {
  useNotificationsStore.getState().reset();
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === 'gc.user')!,
    status: 'authenticated',
  });
});

describe('Topbar', () => {
  it('home variant overrides the focus ring with gold on navy', () => {
    const { container } = render(<Topbar variant="home" />);
    expect(container.querySelector('header')).toHaveClass('[--focus-ring:#d4b37a]');
  });
  it('module variant keeps the default ring', () => {
    const { container } = render(<Topbar variant="module" />);
    expect(container.querySelector('header')).not.toHaveClass('[--focus-ring:#d4b37a]');
  });
  it('has no global search input', () => {
    render(<Topbar variant="home" />);
    expect(screen.queryByRole('searchbox')).toBeNull();
  });
  it('menu button reports state and calls onMenuClick', async () => {
    const onMenuClick = vi.fn();
    render(
      <Topbar
        variant="home"
        menuOpen={false}
        menuControlsId="mobile-nav"
        onMenuClick={onMenuClick}
      />,
    );
    const btn = screen.getByRole('button', { name: lo.topbar.menu });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn).toHaveAttribute('aria-controls', 'mobile-nav');
    expect(btn).toHaveClass('md:hidden');
    await userEvent.click(btn);
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });
  it('user menu shows name, employee code, role, division, support and logout', async () => {
    render(<Topbar variant="home" />);
    await userEvent.click(screen.getByRole('button', { name: lo.topbar.userMenu }));
    const u = MOCK_USERS.find((x) => x.username === 'gc.user')!;
    expect(await screen.findByText(u.fullName)).toBeInTheDocument();
    expect(screen.getByText(u.employeeCode!)).toBeInTheDocument();
    expect(screen.getByText(lo.roles.MAIN_USER)).toBeInTheDocument();
    expect(screen.getByText(u.division!)).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: lo.support.menu })).toHaveAttribute(
      'href',
      '/support',
    );
    expect(screen.getByRole('menuitem', { name: lo.auth.logout })).toBeInTheDocument();
  });
});
