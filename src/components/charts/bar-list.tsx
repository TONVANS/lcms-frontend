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
  orientation?: 'horizontal' | 'vertical';
  height?: number;
}

// Literal class strings so Tailwind can detect them.
const ACCENT_GRADIENT: Record<BarListAccent, string> = {
  ppa: 'bg-linear-to-r from-(--series-ppa-from) to-(--series-ppa-to)',
  gc: 'bg-linear-to-r from-(--series-gc-from) to-(--series-gc-to)',
  legal: 'bg-linear-to-r from-(--series-legal-from) to-(--series-legal-to)',
  litigation: 'bg-linear-to-r from-(--series-litigation-from) to-(--series-litigation-to)',
};

const ACCENT_GRADIENT_VERTICAL: Record<BarListAccent, string> = {
  ppa: 'bg-linear-to-t from-(--series-ppa-from) to-(--series-ppa-to)',
  gc: 'bg-linear-to-t from-(--series-gc-from) to-(--series-gc-to)',
  legal: 'bg-linear-to-t from-(--series-legal-from) to-(--series-legal-to)',
  litigation: 'bg-linear-to-t from-(--series-litigation-from) to-(--series-litigation-to)',
};

export function BarList({
  data,
  maxValue,
  accent = 'ppa',
  valueFormatter = (val) => formatNumber(val),
  className,
  orientation = 'horizontal',
  height = 140,
}: BarListProps) {
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));

  if (orientation === 'vertical') {
    const verticalGradientClass = ACCENT_GRADIENT_VERTICAL[accent] ?? ACCENT_GRADIENT_VERTICAL.ppa;

    return (
      <div className={cn('flex flex-col', className)}>
        <div className="flex items-end justify-between gap-2 overflow-x-auto pt-3 pb-1 sm:gap-4 scrollbar-none">
          {data.map((item) => {
            const percent = max > 0 ? Math.min(100, Math.round((item.value / max) * 100)) : 0;

            return (
              <div
                key={item.key}
                className="group flex flex-1 min-w-[56px] max-w-[84px] flex-col items-center gap-2"
              >
                {/* Count value above column */}
                <span className="text-xs font-semibold tabular-nums text-[var(--text-strong)] group-hover:text-[var(--gc)] transition-colors">
                  {valueFormatter(item.value)}
                </span>

                {/* Vertical column track */}
                <div
                  className="relative flex w-full max-w-[36px] items-end justify-center overflow-hidden rounded-t-lg bg-[var(--surface-inset)] border border-[var(--border-subtle)]"
                  style={{ height: `${height}px` }}
                >
                  <div
                    data-testid={`bar-fill-${item.key}`}
                    className={cn(
                      'w-full rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-sm',
                      verticalGradientClass,
                    )}
                    style={{
                      height: item.value > 0 ? `${Math.max(8, percent)}%` : '0%',
                    }}
                  />
                </div>

                {/* Baseline divider */}
                <div className="w-full border-b border-[var(--border-subtle)]" />

                {/* Document Type Label below */}
                <div className="flex flex-col items-center gap-0.5 text-center min-w-0 w-full px-0.5">
                  <span
                    title={item.label}
                    className="w-full truncate text-[11px] font-medium text-[var(--text)] group-hover:text-[var(--text-strong)] transition-colors"
                  >
                    {item.label}
                  </span>
                  {item.subValue && (
                    <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
                      ({item.subValue})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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

