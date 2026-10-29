'use client';

import { CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { GlassCard } from '@/components/shared/glass-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth';
import {
  contractHref,
  notificationKey,
  useNotificationsStore,
  type AppNotification,
} from '@/features/notifications';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { daysLeft, formatDate } from '@/lib/utils/date';
import { gcService } from '../api/gc.service';
import type { Contract } from '../types';

const FOCUS =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';
const PAGE_SIZE = 50;

interface Loaded {
  expiring: Contract[];
  expired: Contract[];
}

function AlertsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

function ContractRows({ id, title, rows }: { id: string; title: string; rows: Contract[] }) {
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-serif text-base font-semibold text-[var(--text-strong)]">
        {title}
      </h2>
      <ul className="flex flex-col gap-2.5">
        {rows.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3"
          >
            <div className="min-w-0">
              <Link
                href={`/contracts/${c.id}`}
                className={cn(
                  'flex min-h-11 items-center rounded-sm text-sm font-medium text-[var(--text-strong)] underline-offset-2 hover:underline',
                  FOCUS,
                )}
              >
                {c.title}
              </Link>
              <p className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {c.contractNumber} · {lo.gc.alerts.due}: {formatDate(c.expirationDate)}
              </p>
            </div>
            <CountdownBadge days={daysLeft(c.expirationDate)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotificationRows({ rows }: { rows: AppNotification[] }) {
  const markRead = useNotificationsStore((s) => s.markRead);
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="gc-alerts-notifications" className="flex flex-col gap-3">
      <h2
        id="gc-alerts-notifications"
        className="font-serif text-base font-semibold text-[var(--text-strong)]"
      >
        {lo.gc.alerts.notificationsSection}
      </h2>
      <ul className="flex flex-col gap-2.5">
        {rows.map((n) => {
          const href = contractHref(n);
          return (
            <li
              key={notificationKey(n)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                {n.read ? null : (
                  <>
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[var(--gc)]" />
                    <span className="sr-only">{lo.topbar.unread}</span>
                  </>
                )}
                <div className="min-w-0">
                  {href ? (
                    <Link
                      href={href}
                      className={cn(
                        'flex min-h-11 items-center rounded-sm text-sm text-[var(--text-strong)] underline-offset-2 hover:underline',
                        n.read ? 'font-medium' : 'font-semibold',
                        FOCUS,
                      )}
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-[var(--text-strong)]">{n.title}</span>
                  )}
                  {n.message ? (
                    <p className="text-[11px] text-[var(--text-muted)]">{n.message}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CountdownBadge days={n.daysLeft} />
                {n.read ? null : (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${lo.gc.alerts.markRead}: ${n.title}`}
                    onClick={() => void markRead(n)}
                    className="min-h-11 min-w-11"
                  >
                    <CheckCheck className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function GcAlertsView() {
  const user = useAuthStore((s) => s.user);
  const notifStatus = useNotificationsStore((s) => s.status);
  const allNotifications = useNotificationsStore((s) => s.items);
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      gcService.list({ status: 'EXPIRING_SOON', page: 1, pageSize: PAGE_SIZE }),
      gcService.list({ status: 'EXPIRED', page: 1, pageSize: PAGE_SIZE }),
    ])
      .then(([expiring, expired]) => {
        if (active) setData({ expiring: expiring.items, expired: expired.items });
      })
      .catch((e: unknown) => {
        if (active) setError(toUserMessage(normalizeError(e)) || lo.errors.unknown);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (user && notifStatus === 'idle') void useNotificationsStore.getState().fetch(user);
  }, [user, notifStatus]);

  const retry = useCallback(() => {
    setError(null);
    setData(null);
    setAttempt((n) => n + 1);
  }, []);

  const header = <PageHeader eyebrow="GC" title={lo.gc.alerts.title} accent="gc" />;

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <AlertBanner
          tone="rose"
          title={error}
          action={
            <Button variant="secondary" onClick={retry}>
              {lo.common.retry}
            </Button>
          }
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <AlertsSkeleton />
      </div>
    );
  }

  const notifications = allNotifications.filter((n) => n.source === 'contracts');
  const empty = data.expiring.length === 0 && data.expired.length === 0 && notifications.length === 0;
  if (empty) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <GlassCard accent="gc">
          <EmptyState title={lo.gc.alerts.empty} />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}
      {notifications.length > 0 && notifications.every((n) => n.read) ? (
        <p role="status" className="text-sm text-[var(--text-muted)]">
          {lo.gc.alerts.allRead}
        </p>
      ) : null}
      <ContractRows id="gc-alerts-expiring" title={lo.gc.alerts.expiringSection} rows={data.expiring} />
      <NotificationRows rows={notifications} />
      <ContractRows id="gc-alerts-expired" title={lo.gc.alerts.expiredSection} rows={data.expired} />
    </div>
  );
}
