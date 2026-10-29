import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { supportService } from '@/features/support';
import { lo } from '@/lib/i18n/lo';
import { SupportDialog } from './support-dialog';
import { UserMenu } from './user-menu';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

beforeEach(() => {
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === 'gc.viewer')!,
    status: 'authenticated',
  });
});

describe('SupportDialog', () => {
  it('support dialog exposes tel and mailto links', () => {
    render(<SupportDialog open onOpenChange={() => {}} />);
    expect(screen.getByRole('link', { name: /\+856 21 000 000/ })).toHaveAttribute(
      'href',
      'tel:+85621000000',
    );
    expect(screen.getByRole('link', { name: /support@lcms\.example/ })).toHaveAttribute(
      'href',
      'mailto:support@lcms.example',
    );
  });
});

describe('SupportDialog with API contacts', () => {
  it('renders channels from the API and falls back to static contacts when empty', async () => {
    const spy = vi.spyOn(supportService, 'contacts').mockResolvedValueOnce([
      { id: '1', channelName: 'Line', contactInfo: '+856 20 9999 8888', description: null, sortOrder: 1, isActive: true },
      { id: '2', channelName: 'Office', contactInfo: 'Floor 3', description: null, sortOrder: 2, isActive: true },
    ]);
    const { unmount } = render(<SupportDialog open onOpenChange={() => {}} />);
    expect(await screen.findByText('Line')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+856 20 9999 8888' })).toHaveAttribute('href', 'tel:+8562099998888');
    expect(screen.getByText('Floor 3')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /support@lcms.example/ })).toBeNull();
    unmount();
    spy.mockResolvedValueOnce([]);
    render(<SupportDialog open onOpenChange={() => {}} />);
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('link', { name: /support@lcms.example/ })).toBeInTheDocument();
  });
});

describe('UserMenu support item', () => {
  it('links to the support page instead of opening a dialog', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    await user.click(screen.getByRole('button', { name: lo.topbar.userMenu }));
    expect(await screen.findByRole('menuitem', { name: lo.support.menu })).toHaveAttribute('href', '/support');
  });

  describe('does not open without choosing the support item', () => {
    it('Escape closes the menu with no dialog and focus on the trigger', async () => {
      const user = userEvent.setup();
      render(<UserMenu />);
      const trigger = screen.getByRole('button', { name: lo.topbar.userMenu });
      await user.click(trigger);
      await screen.findByRole('menu');
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('clicking outside closes the menu with no dialog', async () => {
      const user = userEvent.setup();
      render(<UserMenu />);
      await user.click(screen.getByRole('button', { name: lo.topbar.userMenu }));
      await screen.findByRole('menu');
      fireEvent.pointerDown(document.body);
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('choosing logout opens no dialog', async () => {
      const logout = vi.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ logout });
      const user = userEvent.setup();
      render(<UserMenu />);
      await user.click(screen.getByRole('button', { name: lo.topbar.userMenu }));
      await user.click(await screen.findByRole('menuitem', { name: lo.auth.logout }));
      await waitFor(() => expect(logout).toHaveBeenCalled());
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
