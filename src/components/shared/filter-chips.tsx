'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface FilterChipOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

export interface FilterChipsProps {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
  accent?: 'gold' | 'ppa' | 'gc' | 'legal';
  ariaLabel?: string;
  className?: string;
}

const ACCENT_STYLES = {
  gold: {
    selected:
      'bg-[rgba(212,179,122,0.16)] text-[#d4b37a] dark:text-[#d4b37a] border-[#d4b37a]/40 shadow-[0_0_12px_rgba(212,179,122,0.15)]',
  },
  ppa: {
    selected:
      'bg-[rgba(92,200,255,0.15)] text-[#0369a1] dark:text-[#5cc8ff] border-[#0ea5e9]/40 dark:border-[#5cc8ff]/40 shadow-[0_0_12px_rgba(92,200,255,0.15)]',
  },
  gc: {
    selected:
      'bg-[rgba(139,156,255,0.15)] text-[#4338ca] dark:text-[#8b9cff] border-[#6366f1]/40 dark:border-[#8b9cff]/40 shadow-[0_0_12px_rgba(139,156,255,0.15)]',
  },
  legal: {
    selected:
      'bg-[rgba(212,179,122,0.16)] text-[#8a6a2f] dark:text-[#d4b37a] border-[#b08a4a]/40 dark:border-[#d4b37a]/40 shadow-[0_0_12px_rgba(212,179,122,0.15)]',
  },
};

export function FilterChips({
  options,
  value,
  onChange,
  accent = 'gold',
  ariaLabel,
  className,
}: FilterChipsProps) {
  const selectedStyle = ACCENT_STYLES[accent]?.selected ?? ACCENT_STYLES.gold.selected;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-inset)] border border-[var(--border-subtle)]', className)}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 min-h-[38px] text-xs font-medium transition-all duration-150 cursor-pointer select-none border',
              'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)',
              isSelected
                ? cn('font-semibold', selectedStyle)
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-white/[0.04]'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
            <span>{option.label}</span>
            {typeof option.count === 'number' && (
              <span className="ml-1 rounded-full px-1.5 py-0.2 text-[10px] tabular-nums bg-white/10 text-[var(--text-muted)]">
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
