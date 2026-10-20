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
  accent?: 'gold' | 'ppa' | 'gc' | 'legal' | 'litigation';
  ariaLabel: string;
  className?: string;
}

const ACCENT_STYLES: Record<NonNullable<FilterChipsProps['accent']>, string> = {
  gold: 'bg-(--gold)/12 text-(--text-strong) dark:text-(--gold) border-(--gold)/30',
  ppa: 'bg-(--ppa)/12 text-(--text-strong) dark:text-(--ppa) border-(--ppa)/30',
  gc: 'bg-(--gc)/12 text-(--text-strong) dark:text-(--gc) border-(--gc)/30',
  legal: 'bg-(--legal)/12 text-(--text-strong) dark:text-(--legal) border-(--legal)/30',
  litigation: 'bg-(--litigation)/12 text-(--text-strong) dark:text-(--litigation) border-(--litigation)/30',
};

export function FilterChips({
  options,
  value,
  onChange,
  accent = 'gold',
  ariaLabel,
  className,
}: FilterChipsProps) {
  const selectedStyle = ACCENT_STYLES[accent];

  return (
    <div
      role="group"
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
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 min-h-11 text-xs font-medium transition-[transform,opacity] duration-150 cursor-pointer select-none border',
              'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)',
              isSelected
                ? cn('font-semibold', selectedStyle)
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-white/[0.04]'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
            <span>{option.label}</span>
            {typeof option.count === 'number' && (
              <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--text-secondary)]">
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
