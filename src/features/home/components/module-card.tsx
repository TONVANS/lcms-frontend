import Link from 'next/link';
import { GlassCard } from '@/components/shared/glass-card';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/number';
import type { ModuleKey } from '@/types/domain';
import type { ModuleStats } from '../types';

// Tinted chip recipe (Design.md section 2.4): 12% fill, 30% border, accent text.
export const CHIP_CLASS: Record<ModuleKey, string> = {
  ppa: 'border border-[color-mix(in_srgb,var(--ppa)_30%,transparent)] bg-[color-mix(in_srgb,var(--ppa)_12%,transparent)] text-ppa',
  gc: 'border border-[color-mix(in_srgb,var(--gc)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc)_12%,transparent)] text-gc',
  legal:
    'border border-[color-mix(in_srgb,var(--legal)_30%,transparent)] bg-[color-mix(in_srgb,var(--legal)_12%,transparent)] text-legal',
};

const EYEBROW_CLASS: Record<ModuleKey, string> = {
  ppa: 'text-ppa',
  gc: 'text-gc',
  legal: 'text-legal',
};

interface ModuleCardProps {
  module: ModuleKey;
  stats?: ModuleStats;
}

export function ModuleCard({ module, stats }: ModuleCardProps) {
  const meta = MODULES[module];
  const Icon = meta.icon;
  const items: Array<[string, number | undefined]> = [
    [lo.home.stats.total, stats?.total],
    [lo.home.stats.active, stats?.active],
    [lo.home.stats.expiring, stats?.expiring],
  ];
  return (
    <GlassCard accent={module} interactive className="flex h-full flex-col gap-5">
      <div className="flex items-center gap-3">
        <span
          className={cn('grid size-11 shrink-0 place-items-center rounded-xl', CHIP_CLASS[module])}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <p className={cn('text-xs font-semibold tracking-[0.14em] uppercase', EYEBROW_CLASS[module])}>
          {meta.code}
        </p>
      </div>
      <h2 className="font-serif text-[22px] leading-[1.4] font-semibold text-text-strong">
        {meta.name}
      </h2>
      <dl className="grid grid-cols-3 gap-3">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="truncate text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-xl font-semibold text-text-strong tabular-nums">
              {value === undefined ? '—' : formatNumber(value)}
            </dd>
          </div>
        ))}
      </dl>
      <Link
        href={meta.href}
        className="mt-auto inline-flex min-h-11 items-center text-sm font-semibold text-gold hover:underline"
      >
        {lo.home.openModule}
      </Link>
    </GlassCard>
  );
}
