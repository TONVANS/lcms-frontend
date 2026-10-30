'use client';

import { CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { GlassCard } from '@/components/shared/glass-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import {
  contractHref,
  notificationKey,
  sourcesFor,
  useNotificationsStore,
} from '../store/notifications.store';
import type { NotificationSource } from '../types';

const FOCUS =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

const SOURCE_LABEL: Record<NotificationSource, string> = {
  contracts: lo.notifications.sourceContracts,
  power: lo.notifications.sourcePower,
};

type SourceFilter = 'all' | NotificationSource;

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

export function NotificationsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const user = useAuthStore((s) => s.user);
  const items = useNotificationsStore((s) => s.items);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const status = useNotificationsStore((s) => s.status);
  const error = useNotificationsStore((s) => s.error);

  const rawSource = searchParams.get('source');
  const initialSource: SourceFilter =
    rawSource === 'contracts' || rawSource === 'power' ? rawSource : 'all';
  const initialUnreadOnly = searchParams.get('unread') === 'true';

  const [source, setSource] = useState<SourceFilter>(initialSource);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(initialUnreadOnly);

  const searchParamsString = searchParams.toString();
  const lastUrlRef = useRef<string | null>(searchParamsString);

  useEffect(() => {
    if (lastUrlRef.current === searchParamsString) return;
    lastUrlRef.current = searchParamsString;
    const sp = new URLSearchParams(searchParamsString);
    const s = sp.get('source');
    setSource(s === 'contracts' || s === 'power' ? s : 'all');
    setUnreadOnly(sp.get('unread') === 'true');
  }, [searchParamsString]);

  const updateUrl = useCallback(
    (newSource: SourceFilter, newUnread: boolean) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (newSource === 'all') {
        sp.delete('source');
      } else {
        sp.set('source', newSource);
      }
      if (newUnread) {
        sp.set('unread', 'true');
      } else {
        sp.delete('unread');
      }
      const qs = sp.toString();
      lastUrlRef.current = qs;
      const target = qs ? `${pathname}?${qs}` : pathname;
      router.replace(target, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handleSourceChange = (newSource: SourceFilter) => {
    setSource(newSource);
    updateUrl(newSource, unreadOnly);
  };

  const handleUnreadChange = (newUnread: boolean) => {
    setUnreadOnly(newUnread);
    updateUrl(source, newUnread);
  };

  useEffect(() => {
    if (user) void useNotificationsStore.getState().fetch(user);
  }, [user]);

  const sources = useMemo(() => (user ? sourcesFor(user) : []), [user]);

  const activeSource: SourceFilter =
    source !== 'all' && !sources.includes(source as NotificationSource) ? 'all' : source;

  const visible = useMemo(
    () =>
      items.filter(
        (n) => (activeSource === 'all' || n.source === activeSource) && (!unreadOnly || !n.read),
      ),
    [items, activeSource, unreadOnly],
  );

  const header = (
    <PageHeader
      title={lo.topbar.notifications}
      actions={
        <Button
          variant="secondary"
          onClick={() => void useNotificationsStore.getState().markAllRead()}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="size-4" aria-hidden="true" />
          {lo.notifications.markAllRead}
        </Button>
      }
    />
  );

  const retry = (
    <Button variant="secondary" onClick={() => user && void useNotificationsStore.getState().fetch(user)}>
      {lo.common.retry}
    </Button>
  );

  if (status === 'error' && items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <AlertBanner tone="rose" title={error ?? lo.notifications.loadError} action={retry} />
      </div>
    );
  }

  const loading = (status === 'idle' || status === 'loading') && items.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {header}
      {error ? <AlertBanner tone="rose" title={error} action={retry} /> : null}
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label={lo.notifications.filterLabel} className="flex flex-wrap gap-2">
          {(['all', ...sources] as SourceFilter[]).map((s) => {
            const active = activeSource === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => handleSourceChange(s)}
                className={cn(
                  'min-h-11 rounded-full border px-4 text-sm font-medium',
                  active
                    ? 'border-[var(--border-strong)] bg-[var(--surface-inset)] text-[var(--text-strong)]'
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)]',
                  FOCUS,
                )}
              >
                {s === 'all' ? lo.notifications.all : SOURCE_LABEL[s]}
              </button>
            );
          })}
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => handleUnreadChange(e.target.checked)}
            className={cn('size-4', FOCUS)}
          />
          {lo.notifications.unreadOnly}
        </label>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <GlassCard>
          <EmptyState
            title={unreadOnly ? lo.notifications.emptyUnread : lo.notifications.empty}
          />
        </GlassCard>
      ) : (
        <ul aria-label={lo.notifications.list} className="flex flex-col gap-2.5">
          {visible.map((n) => {
            const href = contractHref(n);
            return (
              <li
                key={notificationKey(n)}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      n.read ? 'border border-[var(--text-muted)]' : 'bg-[var(--gc)]',
                    )}
                  />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-sm text-[var(--text-strong)]',
                        n.read ? 'font-medium' : 'font-semibold',
                      )}
                    >
                      {n.title}
                    </p>
                    {n.message ? (
                      <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">{n.message}</p>
                    ) : null}
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-[var(--text-muted)] tabular-nums">
                      <span>{SOURCE_LABEL[n.source]}</span>
                      <span className="font-medium">
                        {n.read ? lo.notifications.read : lo.notifications.unread}
                      </span>
                      {n.expirationDate ? (
                        <span>
                          {lo.notifications.expires}: {formatDate(n.expirationDate)}
                        </span>
                      ) : null}
                      {n.createdAt ? <span>{formatDate(n.createdAt)}</span> : null}
                    </p>
                    {href && n.contractLabel ? (
                      <Link
                        href={href}
                        className={cn(
                          'mt-1 inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-[var(--text-strong)] underline underline-offset-2',
                          FOCUS,
                        )}
                      >
                        {n.contractLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CountdownBadge days={n.daysLeft} />
                  {n.read ? null : (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${lo.notifications.markRead}: ${n.title}`}
                      onClick={() => void useNotificationsStore.getState().markRead(n)}
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
      )}
    </div>
  );
}
