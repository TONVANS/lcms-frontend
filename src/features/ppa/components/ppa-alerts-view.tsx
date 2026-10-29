'use client';

import { CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { GlassCard } from '@/components/shared/glass-card';
import { ContractStatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth';
import { contractHref, notificationKey, useNotificationsStore } from '@/features/notifications';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { daysLeft, formatDate } from '@/lib/utils/date';
import { ppaService } from '../api/ppa.service';
import type { PowerContract } from '../types';

const PAGE = 50;

const FOCUS =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

type ListState =
  | { kind: 'loading' }
  | { kind: 'ready'; expiring: PowerContract[]; expired: PowerContract[] }
  | { kind: 'error'; message: string };

function ContractRows({ items, empty, showCountdown }: { items: PowerContract[]; empty: string; showCountdown: boolean }) {
  if (items.length === 0) {
    return (
      <GlassCard accent="ppa">
        <EmptyState title={empty} />
      </GlassCard>
    );
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((c) => (
        <li
          key={c.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--border-subtle) bg-(--surface-inset) p-3"
        >
          <div className="min-w-0">
            <Link
              href={`/ppa/contracts/${encodeURIComponent(c.id)}`}
              className={cn('rounded-sm text-sm font-medium text-(--text-strong) hover:underline', FOCUS)}
            >
              {c.projectName || c.contractNumber}
            </Link>
            <p className="mt-0.5 text-xs text-(--text-muted) tabular-nums">
              {c.contractNumber} · {lo.ppa.fields.expirationDate}: {formatDate(c.expirationDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showCountdown ? <CountdownBadge days={daysLeft(c.expirationDate)} /> : null}
            <ContractStatusBadge status={c.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PpaAlertsView() {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<ListState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const notifications = useNotificationsStore((s) => s.items);
  const notificationsStatus = useNotificationsStore((s) => s.status);

  useEffect(() => {
    let active = true;
    Promise.all([
      ppaService.list({ status: 'EXPIRING_SOON', page: 1, pageSize: PAGE }),
      ppaService.list({ status: 'EXPIRED', page: 1, pageSize: PAGE }),
    ])
      .then(([expiring, expired]) => {
        if (active) setState({ kind: 'ready', expiring: expiring.items, expired: expired.items });
      })
      .catch((e: unknown) => {
        if (active) {
          setState({ kind: 'error', message: toUserMessage(normalizeError(e)) || lo.ppa.alerts.loadError });
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (user) void useNotificationsStore.getState().fetch(user);
  }, [user]);

  const retry = useCallback(() => {
    setState({ kind: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  const power = useMemo(() => notifications.filter((n) => n.source === 'power'), [notifications]);
  const unread = power.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={MODULES.ppa.code} title={lo.ppa.alerts.title} accent="ppa" />

      {state.kind === 'error' ? (
        <AlertBanner
          tone="rose"
          title={state.message}
          action={
            <Button variant="secondary" onClick={retry}>
              {lo.common.retry}
            </Button>
          }
        />
      ) : null}

      <section aria-labelledby="ppa-alerts-expiring" className="flex flex-col gap-3">
        <h2 id="ppa-alerts-expiring" className="font-serif text-lg font-semibold text-(--text-strong)">
          {lo.ppa.alerts.expiringSoon}
        </h2>
        {state.kind === 'loading' ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : state.kind === 'ready' ? (
          <ContractRows items={state.expiring} empty={lo.ppa.alerts.emptyExpiring} showCountdown />
        ) : null}
      </section>

      <section aria-labelledby="ppa-alerts-expired" className="flex flex-col gap-3">
        <h2 id="ppa-alerts-expired" className="font-serif text-lg font-semibold text-(--text-strong)">
          {lo.ppa.alerts.expired}
        </h2>
        {state.kind === 'loading' ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : state.kind === 'ready' ? (
          <ContractRows items={state.expired} empty={lo.ppa.alerts.emptyExpired} showCountdown={false} />
        ) : null}
      </section>

      <section aria-labelledby="ppa-alerts-notifications" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="ppa-alerts-notifications" className="font-serif text-lg font-semibold text-(--text-strong)">
            {lo.ppa.alerts.notifications}
          </h2>
          <Button
            variant="secondary"
            disabled={unread === 0}
            onClick={() => void useNotificationsStore.getState().markAllRead()}
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            {lo.notifications.markAllRead}
          </Button>
        </div>
        {notificationsStatus === 'loading' && power.length === 0 ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : power.length === 0 ? (
          <GlassCard accent="ppa">
            <EmptyState title={lo.ppa.alerts.emptyNotifications} />
          </GlassCard>
        ) : (
          <ul aria-label={lo.ppa.alerts.notifications} className="flex flex-col gap-2.5">
            {power.map((n) => {
              const href = contractHref(n);
              return (
                <li
                  key={notificationKey(n)}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-(--border-subtle) bg-(--surface-inset) p-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        n.read ? 'border border-(--text-muted)' : 'bg-(--ppa)',
                      )}
                    />
                    <div className="min-w-0">
                      <p className={cn('text-sm text-(--text-strong)', n.read ? 'font-medium' : 'font-semibold')}>
                        {n.title}
                      </p>
                      {n.message ? <p className="mt-0.5 text-[13px] text-(--text-muted)">{n.message}</p> : null}
                      <p className="mt-1 text-[11px] text-(--text-muted) tabular-nums">
                        {n.read ? lo.notifications.read : lo.notifications.unread}
                        {n.createdAt ? ` · ${formatDate(n.createdAt)}` : ''}
                      </p>
                      {href && n.contractLabel ? (
                        <Link
                          href={href}
                          className={cn(
                            'mt-1 inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-(--text-strong) underline underline-offset-2',
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
      </section>
    </div>
  );
}
