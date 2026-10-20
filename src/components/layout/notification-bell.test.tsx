import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { NotificationBell } from './notification-bell';

describe('NotificationBell', () => {
  it('links to /notifications with the Lao label', () => {
    render(<NotificationBell unreadCount={0} />);
    const link = screen.getByRole('link', { name: new RegExp(lo.topbar.notifications) });
    expect(link).toHaveAttribute('href', '/notifications');
  });

  it('shows the rose dot only when unread > 0', () => {
    const { container, rerender } = render(<NotificationBell unreadCount={0} />);
    expect(container.querySelector('[data-testid="unread-dot"]')).toBeNull();
    rerender(<NotificationBell unreadCount={3} />);
    const dot = container.querySelector('[data-testid="unread-dot"]');
    expect(dot).not.toBeNull();
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('link').getAttribute('aria-label')).toContain('3');
  });
});
