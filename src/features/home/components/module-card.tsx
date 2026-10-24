import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

const SUBTITLES: Record<ModuleKey, string> = {
  ppa: lo.home.ppaSubtitle ?? 'ສັນຍາຊື້-ຂາຍໄຟຟ້າ & ພະລັງງານ',
  gc: lo.home.gcSubtitle ?? 'ສັນຍາທົ່ວໄປ, ການຄ້າ & ຈັດຊື້-ຈັດຈ້າງ',
  legal: lo.home.legalSubtitle ?? 'ນິຕິກຳ, ລະບຽບການ & ຄະດີຄວາມ',
};

interface ModuleCardProps {
  module: ModuleKey;
  stats?: ModuleStats;
}

export function ModuleCard({ module, stats }: ModuleCardProps) {
  const meta = MODULES[module];
  const Icon = meta.icon;
  const items: Array<{
    label: string;
    value: number | undefined;
    indicator?: 'neutral' | 'emerald' | 'amber';
  }> = [
    { label: lo.home.stats.total, value: stats?.total, indicator: 'neutral' },
    { label: lo.home.stats.active, value: stats?.active, indicator: 'emerald' },
    { label: lo.home.stats.expiring, value: stats?.expiring, indicator: 'amber' },
  ];

  return (
    <GlassCard
      accent={module}
      interactive
      className="group relative flex h-full flex-col justify-between gap-6 p-6 sm:p-7 transition-all duration-300 hover:shadow-xl hover:border-gold/30"
    >
      <div className="flex flex-col gap-4">
        {/* Module Header with Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-105',
                CHIP_CLASS[module],
              )}
            >
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <span
                className={cn(
                  'text-[11px] font-bold tracking-[0.14em] uppercase',
                  EYEBROW_CLASS[module],
                )}
              >
                {meta.code}
              </span>
              <p className="text-xs text-muted-foreground truncate">
                {SUBTITLES[module]}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase',
              CHIP_CLASS[module],
            )}
          >
            {meta.code}
          </span>
        </div>

        {/* Module Name */}
        <h2 className="font-heading text-xl sm:text-[22px] leading-[1.35] font-semibold text-text-strong group-hover:text-primary transition-colors">
          {meta.name}
        </h2>

        {/* Metric Pods */}
        <dl className="grid grid-cols-3 gap-2.5 pt-1">
          {items.map(({ label, value, indicator }) => (
            <div
              key={label}
              className="flex flex-col justify-center rounded-xl bg-[var(--surface-inset)]/60 px-3 py-2.5 border border-white/5 transition-colors group-hover:bg-[var(--surface-inset)]"
            >
              <dt className="truncate text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-xl font-bold text-text-strong tabular-nums">
                {indicator === 'emerald' && (value ?? 0) > 0 ? (
                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                ) : null}
                {indicator === 'amber' && (value ?? 0) > 0 ? (
                  <span className="size-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" aria-hidden="true" />
                ) : null}
                <span>{value === undefined ? '—' : formatNumber(value)}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Action CTA */}
      <div className="pt-2 border-t border-border/40">
        <Link
          href={meta.href}
          className="inline-flex min-h-11 w-full items-center justify-between text-sm font-semibold text-(--gold) hover:text-(--gold-soft) transition-colors"
        >
          <span>{lo.home.openModule}</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary/80 border border-border/50 text-foreground transition-all duration-200 group-hover:bg-primary group-hover:text-white group-hover:border-transparent">
            <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </GlassCard>
  );
}
