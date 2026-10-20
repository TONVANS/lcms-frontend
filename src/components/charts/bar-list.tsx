'use client';

import { formatNumber } from '@/lib/utils/number';
import { cn } from '@/lib/utils/cn';

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  subValue?: string;
}

export interface BarListProps {
  data: BarListItem[];
  maxValue?: number;
  accent?: 'ppa' | 'gc' | 'legal';
  valueFormatter?: (value: number) => string;
  className?: string;
}

const ACCENT_GRADIENT: Record<'ppa' | 'gc' | 'legal', string> = {
  ppa: 'bg-gradient-to-r from-[#2563eb] to-[#5cc8ff]',
  gc: 'bg-gradient-to-r from-[#4f46e5] to-[#8b9cff]',
  legal: 'bg-gradient-to-r from-[#9c7c45] to-[#d4b37a]',
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
              <div
                className={cn('h-full rounded-full transition-all duration-500', gradientClass)}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
