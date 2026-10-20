import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { FadeIn } from './fade-in';
import { GlassCard } from './glass-card';

type KpiVariant = 'default' | 'warning' | 'danger';

const VARIANT_CLASS: Record<KpiVariant, string> = {
  default: '',
  warning:
    'border-[rgba(251,191,36,0.35)] bg-[linear-gradient(160deg,rgba(251,191,36,0.14),rgba(251,191,36,0.04))]',
  danger:
    'border-[rgba(251,113,133,0.35)] bg-[linear-gradient(160deg,rgba(251,113,133,0.14),rgba(251,113,133,0.04))]',
};

interface KpiCardProps {
  label: string;
  value: ReactNode;
  delta?: { text: string; positive: boolean };
  variant?: KpiVariant;
  index?: number;
}

export function KpiCard({ label, value, delta, variant = 'default', index }: KpiCardProps) {
  return (
    <FadeIn variant="up" index={index}>
      <GlassCard className={cn('p-5', VARIANT_CLASS[variant])}>
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <p className="mt-1 text-[34px] leading-tight font-semibold text-text-strong tabular-nums">
          {value}
        </p>
        {delta ? (
          <p
            className={cn(
              'mt-1 text-xs tabular-nums',
              delta.positive
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
