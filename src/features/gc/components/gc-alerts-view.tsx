'use client';

import { CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { GlassCard } from '@/components/shared/glass-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { alertsService, useAlertsStore } from '@/features/alerts';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { daysLeft, formatDate } from '@/lib/utils/date';
import type { Alert } from '@/types/domain';
import { groupGcAlerts, type GcAlertGroupKey } from '../lib/group-alerts';

const FOCUS =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

const GROUP_LABEL: Record<GcAlertGroupKey, string> = {
  overdue: lo.gc.alerts.groupOverdue,
  d7: lo.gc.alerts.group7,
  d30: lo.gc.alerts.group30,
  d60: lo.gc.alerts.group60,
};

function AlertsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

export function GcAlertsView() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const pendingRef = useRef(new Set<string>());
  const focusId = useRef<string | null>(null);
  const links = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    let active = true;
    alertsService
      .list({ module: 'gc' })
      .then((res) => {
        if (active) setAlerts(res);
      })
      .catch((e: unknown) => {
        if (active) setError(toUserMessage(normalizeError(e)) || lo.errors.unknown);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  // After a row loses its button, keep focus on the row's link instead of letting it fall to body.
  useEffect(() => {
    const id = focusId.current;
    if (!id) return;
    focusId.current = null;
    links.current.get(id)?.focus();
  }, [alerts]);

  const retry = () => {
    setError(null);
    setAlerts(null);
    setAttempt((n) => n + 1);
  };

  const markRead = useCallback(async (id: string) => {
    if (pendingRef.current.has(id)) return;
    pendingRef.current.add(id);
    setPending(new Set(pendingRef.current));
    try {
      await alertsService.markRead(id);
      focusId.current = id;
      setAlerts((prev) => prev?.map((a) => (a.id === id ? { ...a, read: true } : a)) ?? prev);
      void useAlertsStore.getState().fetch();
    } catch (e) {
      toast.error(toUserMessage(normalizeError(e)) || lo.errors.unknown);
    } finally {
      pendingRef.current.delete(id);
      setPending(new Set(pendingRef.current));
    }
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

  if (!alerts) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <AlertsSkeleton />
      </div>
    );
  }

  const groups = groupGcAlerts(alerts);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <GlassCard accent="gc">
          <EmptyState title={lo.gc.alerts.empty} />
        </GlassCard>
      </div>
    );
  }

  const today = new Date();
  const anyUnread = groups.some((g) => g.alerts.some((a) => !a.read));

  return (
    <div className="flex flex-col gap-6">
      {header}
      {anyUnread ? null : (
        <p role="status" className="text-sm text-[var(--text-muted)]">
          {lo.gc.alerts.allRead}
        </p>
      )}
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`gc-alerts-${g.key}`} className="flex flex-col gap-3">
          <h2
            id={`gc-alerts-${g.key}`}
            className="font-serif text-base font-semibold text-[var(--text-strong)]"
          >
            {GROUP_LABEL[g.key]}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {g.alerts.map((a) => {
              const busy = pending.has(a.id);
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {a.read ? null : (
                      <>
                        <span
                          aria-hidden="true"
                          className="size-2 shrink-0 rounded-full bg-[var(--gc)]"
                        />
                        <span className="sr-only">{lo.topbar.unread}</span>
                      </>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/contracts/${a.entityId}`}
                        ref={(el) => {
                          if (el) links.current.set(a.id, el);
                          else links.current.delete(a.id);
                        }}
                        className={cn(
                          'flex min-h-11 items-center rounded-sm text-sm font-medium text-[var(--text-strong)] underline-offset-2 hover:underline',
                          !a.read && 'font-semibold',
                          FOCUS,
                        )}
                      >
                        {a.title}
                      </Link>
                      <p className="text-[11px] text-[var(--text-muted)] tabular-nums">
                        {lo.gc.alerts.due}: {formatDate(a.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CountdownBadge days={daysLeft(a.dueDate, today)} />
                    {a.read ? null : (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${lo.gc.alerts.markRead}: ${a.title}`}
                        aria-disabled={busy}
                        onClick={() => void markRead(a.id)}
                        className={cn('min-h-11 min-w-11', busy && 'opacity-50')}
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
      ))}
    </div>
  );
}
