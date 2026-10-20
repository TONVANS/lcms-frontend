'use client';

import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

export interface TimelineItem {
  id: string;
  date?: string;
  title: string;
  description?: string;
  status?: 'done' | 'current' | 'future';
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative flex flex-col gap-6 pl-6', className)}>
      {/* 1px vertical connector */}
      <div
        aria-hidden="true"
        className="absolute bottom-3 left-[11px] top-3 w-[1px] bg-[var(--border-subtle)]"
      />

      {items.map((item) => {
        const status = item.status ?? 'done';

        return (
          <div key={item.id} className="relative flex items-start gap-4">
            {/* 10-12px Dot */}
            <div
              className={cn(
                'absolute -left-[24px] top-1.5 h-3 w-3 rounded-full transition-colors',
                status === 'done' && 'bg-[#d4b37a] shadow-[0_0_8px_rgba(212,179,122,0.5)]',
                status === 'current' &&
                  'border-2 border-amber-400 bg-[var(--bg-base)] ring-4 ring-amber-400/25',
                status === 'future' && 'border-2 border-[var(--border-glass)] bg-[var(--surface-inset)]',
              )}
            />

            <div className="flex flex-col gap-0.5">
              {item.date && (
                <span className="text-xs font-semibold tabular-nums text-[var(--gold)]">
                  {formatDate(item.date)}
                </span>
              )}
              <span className="text-sm font-medium text-[var(--text-strong)]">{item.title}</span>
              {item.description && (
                <span className="text-xs leading-relaxed text-[var(--text-muted)]">
                  {item.description}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
