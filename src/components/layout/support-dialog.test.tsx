import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
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

describe('UserMenu support item', () => {
  async function openFromMenu() {
    const user = userEvent.setup();
    render(<UserMenu />);
    const trigger = screen.getByRole('button', { name: lo.topbar.userMenu });
    await user.click(trigger);
    await user.click(await screen.findByRole('menuitem', { name: lo.support.menu }));
    const dialog = await screen.findByRole('dialog', { name: lo.support.title });
    return { user, trigger, dialog };
  }

  it('opens the dialog after the menu closes; Escape restores pointer events and focus', async () => {
    const { user, trigger, dialog } = await openFromMenu();
    expect(dialog).toBeVisible();
    expect(screen.queryByRole('menu')).toBeNull();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.body.style.pointerEvents).not.toBe('none');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('the close button also restores pointer events and focus', async () => {
    const { user, trigger } = await openFromMenu();
    await user.click(screen.getByRole('button', { name: lo.common.close }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.body.style.pointerEvents).not.toBe('none');
    await waitFor(() => expect(trigger).toHaveFocus());
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
