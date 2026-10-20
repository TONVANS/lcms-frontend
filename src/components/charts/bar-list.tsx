'use client';

import { formatNumber } from '@/lib/utils/number';
import { cn } from '@/lib/utils/cn';

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  subValue?: string;
}

export type BarListAccent = 'ppa' | 'gc' | 'legal' | 'litigation';

export interface BarListProps {
  data: BarListItem[];
  maxValue?: number;
  accent?: BarListAccent;
  valueFormatter?: (value: number) => string;
  className?: string;
}

// Literal class strings so Tailwind can detect them.
const ACCENT_GRADIENT: Record<BarListAccent, string> = {
  ppa: 'bg-linear-to-r from-(--series-ppa-from) to-(--series-ppa-to)',
  gc: 'bg-linear-to-r from-(--series-gc-from) to-(--series-gc-to)',
  legal: 'bg-linear-to-r from-(--series-legal-from) to-(--series-legal-to)',
  litigation: 'bg-linear-to-r from-(--series-litigation-from) to-(--series-litigation-to)',
};

export function BarList({
  data,
  maxValue,
  accent = 'ppa',
  valueFormatter = (val) => formatNumber(val),
  className,
}: BarListProps) {
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));
  const gradientClass = ACCENT_GRADIENT[accent] ?? ACCENT_GRADIENT.ppa;

  return (
    <div className={cn('flex flex-col gap-3.5', className)}>
      {data.map((item) => {
        const percent = Math.min(100, Math.round((item.value / max) * 100));

        return (
          <div key={item.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[var(--text-strong)]">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold tabular-nums text-[var(--text)]">
                  {valueFormatter(item.value)}
                </span>
                {item.subValue && (
                  <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                    ({item.subValue})
                  </span>
                )}
              </div>
            </div>

            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-inset)]">
              <div className="h-full w-full origin-left animate-grow-x">
                <div
                  data-testid={`bar-fill-${item.key}`}
                  className={cn('h-full rounded-[4px]', gradientClass)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
