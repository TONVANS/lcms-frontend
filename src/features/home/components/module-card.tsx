import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/shared/glass-card';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/number';
import type { ModuleKey } from '@/types/domain';
import type { ModuleCardVm } from '../types';

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
  ppa: lo.home.ppaSubtitle,
  gc: lo.home.gcSubtitle,
  legal: lo.home.legalSubtitle,
};

interface ModuleCardProps {
  module: ModuleKey;
  card?: ModuleCardVm;
  /** Set when the module's dashboards failed to load. */
  onRetry?: () => void;
}

export function ModuleCard({ module, card, onRetry }: ModuleCardProps) {
  const meta = MODULES[module];
  const Icon = meta.icon;
  const metrics = card?.metrics ?? [];

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

        {onRetry ? (
          <div role="alert" className="flex flex-col items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
            <p>{lo.home.moduleLoadError}</p>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              {lo.common.retry}
            </Button>
          </div>
        ) : (
          <dl className={cn('grid gap-2.5 pt-1', metrics.length === 4 ? 'grid-cols-2' : 'grid-cols-3')}>
            {metrics.map(({ id, label, value, tone }) => (
              <div
                key={id}
                className="flex flex-col justify-center rounded-xl bg-[var(--surface-inset)]/60 px-3 py-2.5 border border-white/5 transition-colors group-hover:bg-[var(--surface-inset)]"
              >
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-xl font-bold text-text-strong tabular-nums">
                  {tone === 'emerald' && value > 0 ? (
                    <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                  ) : null}
                  {tone === 'amber' && value > 0 ? (
                    <span className="size-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                  ) : null}
                  <span>{formatNumber(value)}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
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
