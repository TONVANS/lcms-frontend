'use client';

import Link from 'next/link';
import { ArrowRight, BellRing } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { contractHref, notificationKey, useNotificationsStore } from '@/features/notifications';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';

export function NotificationsSummary() {
  const items = useNotificationsStore((s) => s.items);
  const unread = useNotificationsStore((s) => s.unreadCount);
  const latest = items.slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-text-strong tabular-nums">
        {lo.home.unreadCount(unread)}
      </p>
      {latest.length === 0 ? (
        <EmptyState title={lo.home.noNotifications} />
      ) : (
        <ul className="flex flex-col gap-2">
          {latest.map((n) => {
            const href = contractHref(n) ?? '/notifications';
            return (
              <li key={notificationKey(n)}>
                <Link
                  href={href}
                  className="flex flex-col gap-0.5 rounded-xl border border-border/40 bg-[var(--surface-inset)]/70 px-3.5 py-2.5 hover:border-primary/30"
                >
                  <span
                    className={cn(
                      'truncate text-sm text-text-strong',
                      n.read ? 'font-normal' : 'font-semibold',
                    )}
                  >
                    {n.title}
                  </span>
                  {n.message ? (
                    <span className="truncate text-xs text-muted-foreground">{n.message}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-t border-border/40 pt-2">
        <Link
          href="/notifications"
          className="group inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/90"
        >
          <BellRing aria-hidden="true" className="size-3.5" />
          <span>{lo.home.viewAllAlerts}</span>
          <ArrowRight
            aria-hidden="true"
            className="size-3 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </div>
  );
}
