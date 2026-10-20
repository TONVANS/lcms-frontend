'use client';

import { STATUS_META, type StatusTone } from '@/lib/constants/status';
import { formatNumber } from '@/lib/utils/number';
import { cn } from '@/lib/utils/cn';
import type { ContractStatus } from '@/types/domain';

export interface StatusSegment {
  status: ContractStatus;
  count: number;
}

export interface StackedStatusBarProps {
  data: StatusSegment[];
  total?: number;
  className?: string;
}

const TONE_COLOR: Record<StatusTone, string> = {
  emerald: 'bg-[#34d399]',
  blue: 'bg-[#60a5fa]',
  violet: 'bg-[#a78bfa]',
  amber: 'bg-[#fbbf24]',
  rose: 'bg-[#fb7185]',
  slate: 'bg-[#94a3b8]',
};

const TONE_DOT: Record<StatusTone, string> = {
  emerald: 'bg-[#34d399]',
  blue: 'bg-[#60a5fa]',
  violet: 'bg-[#a78bfa]',
  amber: 'bg-[#fbbf24]',
  rose: 'bg-[#fb7185]',
  slate: 'bg-[#94a3b8]',
};

export function StackedStatusBar({ data, total, className }: StackedStatusBarProps) {
  const sum = total ?? data.reduce((acc, curr) => acc + curr.count, 0);

  if (sum === 0) {
    return (
      <div className={cn('h-3 w-full rounded-full bg-[var(--surface-inset)]', className)} />
    );
  }

  // Filter out 0 count items for the bar segments
  const activeSegments = data.filter((d) => d.count > 0);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Stacked bar with 2px gap and rounded ends */}
      <div className="flex h-3.5 w-full gap-[2px] overflow-hidden rounded-md bg-[var(--surface-inset)] p-[1px]">
        {activeSegments.map((seg) => {
          const percent = (seg.count / sum) * 100;
          const meta = STATUS_META[seg.status] ?? { tone: 'slate', label: seg.status };
          const colorClass = TONE_COLOR[meta.tone] ?? 'bg-[#94a3b8]';

          return (
            <div
              key={seg.status}
              title={`${meta.label}: ${formatNumber(seg.count)} (${percent.toFixed(1)}%)`}
              className={cn(
                'h-full transition-all duration-300 first:rounded-l-[4px] last:rounded-r-[4px]',
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
          const meta = STATUS_META[seg.status] ?? { tone: 'slate', label: seg.status };
          const dotClass = TONE_DOT[meta.tone] ?? 'bg-[#94a3b8]';
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
