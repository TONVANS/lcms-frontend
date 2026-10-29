'use client';

import { DOT_TONE_CLASS } from '@/components/shared/status-badge';
import { STATUS_META, type StatusTone } from '@/lib/constants/status';
import { formatNumber } from '@/lib/utils/number';
import { cn } from '@/lib/utils/cn';
import type { ContractStatus } from '@/types/domain';

export interface StatusSegment<S extends string = ContractStatus> {
  status: S;
  count: number;
}

export interface StackedStatusBarProps<S extends string = ContractStatus> {
  data: StatusSegment<S>[];
  total?: number;
  className?: string;
  /** Defaults to the shared contract STATUS_META label. */
  getLabel?: (status: S) => string;
  /** Defaults to the shared contract STATUS_META tone. */
  getTone?: (status: S) => StatusTone;
}

const TONE_COLOR = DOT_TONE_CLASS;

export function StackedStatusBar<S extends string = ContractStatus>({
  data,
  total,
  className,
  getLabel,
  getTone,
}: StackedStatusBarProps<S>) {
  const metaOf = (status: S): { label: string; tone: StatusTone } => {
    const meta = (STATUS_META as Record<
      string,
      { label: string; tone: StatusTone } | undefined
    >)[status];
    return {
      label: getLabel ? getLabel(status) : (meta?.label ?? status),
      tone: getTone ? getTone(status) : (meta?.tone ?? 'slate'),
    };
  };
  const sum = total ?? data.reduce((acc, curr) => acc + curr.count, 0);

  if (sum === 0) {
    return (
      <div className={cn('h-3 w-full rounded-full bg-[var(--surface-inset)]', className)} />
    );
  }

  // Filter out 0 count items for the bar segments
  const activeSegments = data.filter((d) => d.count > 0);

  const summary = activeSegments
    .map((seg) => `${metaOf(seg.status).label} ${formatNumber(seg.count)}`)
    .join(', ');

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Stacked bar with 2px gap and rounded ends */}
      <div
        role="img"
        aria-label={summary}
        className="flex h-3.5 w-full gap-[2px] overflow-hidden rounded-md bg-[var(--surface-inset)] p-[1px]">
        {activeSegments.map((seg) => {
          const percent = (seg.count / sum) * 100;
          const meta = metaOf(seg.status);
          const colorClass = TONE_COLOR[meta.tone] ?? TONE_COLOR.slate;

          return (
            <div
              key={seg.status}
              title={`${meta.label}: ${formatNumber(seg.count)} (${percent.toFixed(1)}%)`}
              className={cn(
                'h-full first:rounded-l-[4px] last:rounded-r-[4px]',
                colorClass,
              )}
              style={{ width: `${percent}%` }}
            />
          );
        })}
      </div>

      {/* Legend with status dot, label, count, and percent */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        {data.map((seg) => {
          const meta = metaOf(seg.status);
          const dotClass = TONE_COLOR[meta.tone] ?? TONE_COLOR.slate;
          const percent = sum > 0 ? (seg.count / sum) * 100 : 0;

          return (
            <div key={seg.status} className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full shrink-0', dotClass)} />
              <span className="text-[var(--text-secondary)]">{meta.label}</span>
              <span className="font-semibold tabular-nums text-[var(--text-strong)]">
                {formatNumber(seg.count)}
              </span>
              <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                ({percent.toFixed(0)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
