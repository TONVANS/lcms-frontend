'use client';

import type { ReactNode } from 'react';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

export interface TimelineItem {
  id: string;
  date?: string;
  title: string;
  description?: ReactNode;
  status?: 'done' | 'current' | 'future';
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol role="list" className={cn('relative flex list-none flex-col gap-6 pl-6',
        // 1px vertical connector
        "before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-[var(--border-subtle)] before:content-['']", className)}>
      {items.map((item) => {
        const status = item.status ?? 'done';

        return (
          <li key={item.id} className="relative flex items-start gap-4">
            {/* 10-12px Dot */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute -left-[24px] top-1.5 h-3 w-3 rounded-full',
                status === 'done' && 'bg-(--gold-decor)',
                status === 'current' &&
                  'border-2 border-[#92400E] dark:border-[#FBBF24] bg-[var(--bg-base)] ring-4 ring-[#92400E]/25 dark:ring-[#FBBF24]/25',
                status === 'future' && 'border-2 border-[var(--border-glass)] bg-[var(--surface-inset)]',
              )}
            />

            <div className="flex flex-col gap-0.5">
              <span className="sr-only">{lo.timeline.status[status]}</span>
              {item.date && (
                <span className="text-xs font-semibold tabular-nums text-[var(--gold)]">
                  {formatDate(item.date)}
                </span>
              )}
              <span className="text-sm font-medium text-[var(--text-strong)]">{item.title}</span>
              {item.description && (
                <div className="text-xs leading-relaxed text-[var(--text-muted)]">
                  {item.description}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
