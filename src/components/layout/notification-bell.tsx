import { Bell } from 'lucide-react';
import Link from 'next/link';
import { lo } from '@/lib/i18n/lo';

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const hasUnread = unreadCount > 0;
  const label = hasUnread
    ? `${lo.topbar.notifications}, ${unreadCount} ${lo.topbar.unread}`
    : lo.topbar.notifications;

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-foreground transition-colors duration-150 hover:bg-muted"
    >
      <Bell aria-hidden="true" className="size-5" />
      {hasUnread ? (
        <span
          data-testid="unread-dot"
          aria-hidden="true"
          className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-rose-500 ring-2 ring-background"
        />
      ) : null}
    </Link>
  );
}
