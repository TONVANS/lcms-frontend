import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { FadeIn } from './fade-in';
import { GlassCard } from './glass-card';

type KpiVariant = 'default' | 'warning' | 'danger' | 'info';

const VARIANT_CLASS: Record<KpiVariant, string> = {
  default: '',
  warning:
    '[--glass-bg:linear-gradient(160deg,rgba(251,191,36,0.14),rgba(251,191,36,0.04))] [--glass-border:rgba(251,191,36,0.35)]',
  info: '[--glass-bg:linear-gradient(160deg,rgba(37,99,235,0.12),rgba(37,99,235,0.04))] [--glass-border:rgba(37,99,235,0.30)] dark:[--glass-bg:linear-gradient(160deg,rgba(96,165,250,0.14),rgba(96,165,250,0.04))] dark:[--glass-border:rgba(96,165,250,0.35)]',
  danger:
    '[--glass-bg:linear-gradient(160deg,rgba(251,113,133,0.14),rgba(251,113,133,0.04))] [--glass-border:rgba(251,113,133,0.35)]',
};

interface KpiCardProps {
  label: string;
  value: ReactNode;
  /** `positive` undefined renders a neutral (muted) delta, for counts that are not a trend. */
  delta?: { text: string; positive?: boolean };
  variant?: KpiVariant;
  index?: number;
  /** Lift on hover; use when the card sits inside a link. */
  interactive?: boolean;
}

export function KpiCard({
  label,
  value,
  delta,
  variant = 'default',
  index,
  interactive,
}: KpiCardProps) {
  return (
    <FadeIn variant="up" index={index}>
      <GlassCard interactive={interactive} className={cn('p-5', VARIANT_CLASS[variant])}>
        <p className="text-muted-foreground text-[13px]">{label}</p>
        <p className="text-text-strong mt-1 text-[34px] leading-tight font-semibold tabular-nums">
          {value}
        </p>
        {delta ? (
          <p
            className={cn(
              'mt-1 text-xs tabular-nums',
              delta.positive === undefined
                ? 'text-(--text-muted)'
                : delta.positive
                  ? 'text-[#047857] dark:text-[#6EE7B7]'
                  : 'text-[#BE123C] dark:text-[#FDA4AF]',
            )}
          >
            {delta.text}
          </p>
        ) : null}
      </GlassCard>
    </FadeIn>
  );
}
