'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/shared/alert-banner';
import { EmptyState } from '@/components/shared/empty-state';
import { Timeline, type TimelineItem } from '@/components/shared/timeline';
import { Button } from '@/components/ui/button';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import type { HistoryEntry } from '@/types/domain';
import { historyService } from '../api/history.service';
import type { HistoryKind } from '../types';

export interface HistoryTimelineProps {
  kind: HistoryKind;
  id: string;
  pageSize?: number;
  /** Optional backend action filter. */
  action?: string;
  className?: string;
}

const errorText = (err: unknown) => toUserMessage(normalizeError(err)) || lo.errors.unknown;

function toItem(e: HistoryEntry): TimelineItem {
  return {
    id: e.id,
    date: e.createdAt || undefined,
    title: lo.history.actions[e.action] ?? e.action,
    description:
      e.userName || e.changes.length > 0 ? (
        <>
          {e.userName && <p>{lo.history.by(e.userName)}</p>}
          {e.changes.length > 0 && (
            <ul className="mt-1 flex list-none flex-col gap-0.5">
              {e.changes.map((c, i) => (
                <li key={`${c.field}-${i}`}>
                  {lo.history.change(c.label, c.oldValue ?? lo.history.noValue, c.newValue ?? lo.history.noValue)}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : undefined,
  };
}

export function HistoryTimeline({ kind, id, pageSize = 10, action, className }: HistoryTimelineProps) {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    historyService
      .list(kind, id, { page: 1, pageSize, action })
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setTotal(res.total);
        setPage(1);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(errorText(err));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind, id, pageSize, action, reloadKey]);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const res = await historyService.list(kind, id, { page: page + 1, pageSize, action });
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
      setPage(page + 1);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <div className={className} aria-busy="true" aria-label={lo.common.loading}>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--surface-inset)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <AlertBanner
          tone="rose"
          title={lo.history.loadError}
          description={error}
          action={
            <Button type="button" variant="ghost" onClick={retry}>
              {lo.common.retry}
            </Button>
          }
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={className}>
        <EmptyState title={lo.history.empty} />
      </div>
    );
  }

  return (
    <div className={className}>
      <Timeline items={items.map(toItem)} />
      {items.length < total && (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="ghost" onClick={loadMore} disabled={isLoadingMore}>
            {lo.history.loadMore}
          </Button>
        </div>
      )}
    </div>
  );
}
