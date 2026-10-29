import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { useNotificationsStore } from '@/features/notifications';
import { lo } from '@/lib/i18n/lo';
import { AppSidebar } from './app-sidebar';

const nav = vi.hoisted(() => ({ pathname: '/ppa/contracts' }));

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const byName = (username: string) => MOCK_USERS.find((u) => u.username === username)!;
const login = (username: string) =>
  useAuthStore.setState({ user: byName(username), status: 'authenticated' });

describe('AppSidebar', () => {
  beforeEach(() => {
    nav.pathname = '/ppa/contracts';
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
    useNotificationsStore.getState().reset();
  });

  it('overrides the focus ring with gold on the navy surface', () => {
    login('ppa.user');
    const { container } = render(<AppSidebar module="ppa" />);
    expect(container.querySelector('aside')).toHaveClass('[--focus-ring:#d4b37a]');
  });

  it('marks the active item with aria-current, including on detail routes', () => {
    login('ppa.user');
    nav.pathname = '/ppa/contracts/abc';
    render(<AppSidebar />);
    expect(screen.getByRole('link', { name: lo.nav.contracts })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: lo.nav.dashboard })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('ppa.user sees only the ppa group, common links and no admin section', () => {
    login('ppa.user');
    render(<AppSidebar />);
    expect(screen.getByText(lo.modules.ppa)).toBeInTheDocument();
    expect(screen.queryByText(lo.modules.gc)).toBeNull();
    expect(screen.queryByText(lo.modules.legal)).toBeNull();
    expect(screen.queryByRole('button', { name: new RegExp(lo.modules.ppa) })).toBeNull();
    expect(screen.queryByRole('link', { name: lo.admin.users })).toBeNull();
    expect(screen.getByRole('link', { name: new RegExp(lo.nav.notifications) })).toHaveAttribute(
      'href',
      '/notifications',
    );
    expect(screen.getByRole('link', { name: lo.nav.support })).toHaveAttribute('href', '/support');
    expect(screen.queryByRole('link', { name: lo.nav.documents })).toBeNull();
  });

  it('gc.viewer has no create item; gc.user and gc.editor do', () => {
    login('gc.viewer');
    nav.pathname = '/contracts';
    const { unmount } = render(<AppSidebar />);
    expect(screen.queryByRole('link', { name: lo.nav.create })).toBeNull();
    expect(screen.getByRole('link', { name: lo.nav.contracts })).toHaveAttribute(
      'href',
      '/contracts/list',
    );
    unmount();

    login('gc.editor');
    const second = render(<AppSidebar />);
    expect(screen.getByRole('link', { name: lo.nav.create })).toBeInTheDocument();
    second.unmount();

    login('gc.user');
    render(<AppSidebar />);
    expect(screen.getByRole('link', { name: lo.nav.create })).toBeInTheDocument();
  });

  it('legal.user sees dashboard, regulations, cases and create', () => {
    login('legal.user');
    nav.pathname = '/legal/cases/case-1';
    render(<AppSidebar />);
    expect(screen.getByText(lo.modules.legal)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lo.nav.regulations })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lo.nav.cases })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: lo.nav.createLegal })).toBeInTheDocument();
  });

  it('filters legal items by system module', () => {
    useAuthStore.setState({
      user: { ...byName('legal.user'), accessibleModules: ['legal-cases', 'support'] },
      status: 'authenticated',
    });
    nav.pathname = '/legal';
    render(<AppSidebar />);
    expect(screen.queryByRole('link', { name: lo.nav.regulations })).toBeNull();
    expect(screen.getByRole('link', { name: lo.nav.cases })).toBeInTheDocument();
  });

  it('none.user has no module group and no admin section', () => {
    login('none.user');
    nav.pathname = '/support';
    render(<AppSidebar />);
    expect(screen.queryByText(lo.modules.ppa)).toBeNull();
    expect(screen.queryByText(lo.modules.gc)).toBeNull();
    expect(screen.queryByText(lo.modules.legal)).toBeNull();
    expect(screen.getByRole('link', { name: lo.common.home })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lo.nav.support })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('link', { name: lo.admin.users })).toBeNull();
  });

  it('shows the unread badge with an accessible count on notifications', () => {
    login('ppa.user');
    useNotificationsStore.setState({ unreadCount: 7 });
    render(<AppSidebar />);
    const link = screen.getByRole('link', { name: new RegExp(lo.nav.notifications) });
    expect(link).toHaveAccessibleName(`${lo.nav.notifications}, 7 ${lo.topbar.unread}`);
    expect(within(link).getByText('7')).toBeInTheDocument();
  });

  it('shows the user card with name, Lao role and division', () => {
    login('gc.user');
    render(<AppSidebar />);
    const u = byName('gc.user');
    expect(screen.getByText(u.fullName)).toBeInTheDocument();
    expect(screen.getByText(lo.roles.MAIN_USER)).toBeInTheDocument();
    expect(screen.getByText(u.division!)).toBeInTheDocument();
  });

  it('admin sees all three modules as dropdowns plus the admin section', async () => {
    const user = userEvent.setup();
    login('admin');
    render(<AppSidebar />);

    expect(screen.getByRole('button', { name: new RegExp(lo.modules.ppa) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(lo.modules.gc) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(lo.modules.legal) })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: lo.nav.contracts })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lo.nav.create })).toBeInTheDocument();

    const gcButton = screen.getByRole('button', { name: new RegExp(lo.modules.gc) });
    expect(gcButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(gcButton);
    expect(gcButton).toHaveAttribute('aria-expanded', 'true');

    const createLinks = screen.getAllByRole('link', { name: lo.nav.create });
    expect(createLinks.map((l) => l.getAttribute('href'))).toEqual(['/ppa/new', '/contracts/new']);

    expect(screen.getByRole('link', { name: lo.admin.users })).toHaveAttribute(
      'href',
      '/admin/users',
    );
    expect(screen.getByRole('link', { name: lo.admin.auditLogs })).toHaveAttribute(
      'href',
      '/admin/audit-logs',
    );
    expect(screen.getByRole('link', { name: lo.admin.contractTypes })).toHaveAttribute(
      'href',
      '/admin/contract-types',
    );
    expect(screen.getByRole('link', { name: lo.admin.departments })).toHaveAttribute(
      'href',
      '/admin/departments',
    );
  });

  it('auto-expands a module dropdown when the pathname changes into it', () => {
    login('admin');
    nav.pathname = '/';
    const { rerender } = render(<AppSidebar />);
    const gcButton = screen.getByRole('button', { name: new RegExp(lo.modules.gc) });
    expect(gcButton).toHaveAttribute('aria-expanded', 'false');

    nav.pathname = '/contracts';
    rerender(<AppSidebar />);
    expect(screen.getByRole('button', { name: new RegExp(lo.modules.gc) })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
