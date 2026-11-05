'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { contractHref, notificationKey, useNotificationsStore } from '@/features/notifications';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';

const LATEST = 5;

export function NotificationMenu() {
  const items = useNotificationsStore((s) => s.items);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const markRead = useNotificationsStore((s) => s.markRead);

  // Filter only unread notifications
  const unreadItems = items.filter((n) => !n.read);
  const hasUnread = unreadCount > 0 || unreadItems.length > 0;
  const label = hasUnread
    ? `${lo.topbar.notifications}, ${unreadCount} ${lo.topbar.unread}`
    : lo.topbar.notifications;
  const latest = unreadItems.slice(0, LATEST);

  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className="border-border bg-secondary text-foreground hover:bg-muted relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-150"
      >
        <Bell aria-hidden="true" className="size-5" />
        {hasUnread ? (
          <span className="ring-background absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-rose-600 px-1 py-0.5 text-center text-[11px] leading-none font-bold text-white ring-2">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] gap-3 p-3"
        aria-label={lo.topbar.latestNotifications}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold">{lo.topbar.notifications}</p>
            {hasUnread ? (
              <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">
                {unreadCount}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasUnread}
            onClick={() => void markAllRead()}
          >
            {lo.notifications.markAllRead}
          </Button>
        </div>
        {latest.length === 0 ? (
          <p className="text-muted-foreground px-1 py-6 text-center text-[13px]">
            {lo.notifications.emptyUnread}
          </p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {latest.map((n) => {
              const href = contractHref(n);
              return (
                <li
                  key={notificationKey(n)}
                  className="border-border flex flex-col gap-1 rounded-lg border px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-600"
                    />
                    <p className="min-w-0 flex-1 text-[13px] font-semibold break-words">
                      {n.title}
                    </p>
                  </div>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                    <span>{lo.notifications.unread}</span>
                    {n.createdAt ? <span>{formatDate(n.createdAt)}</span> : null}
                    {href && n.contractLabel ? (
                      <Link
                        href={href}
                        onClick={() => void markRead(n)}
                        className="text-foreground rounded-sm font-semibold underline underline-offset-2"
                      >
                        {n.contractLabel}
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/notifications"
          className="text-foreground rounded-sm text-center text-[13px] font-semibold underline underline-offset-2"
        >
          {lo.topbar.seeAll}
        </Link>
      </PopoverContent>
    </Popover>
  );
}
