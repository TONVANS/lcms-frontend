import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type GlassAccent = 'ppa' | 'gc' | 'legal' | 'litigation';

const ACCENT_LINE: Record<GlassAccent, string> = {
  ppa: 'bg-[linear-gradient(90deg,var(--ppa),transparent)]',
  gc: 'bg-[linear-gradient(90deg,var(--gc),transparent)]',
  legal: 'bg-[linear-gradient(90deg,var(--legal),transparent)]',
  litigation: 'bg-[linear-gradient(90deg,var(--litigation),transparent)]',
};

type GlassCardProps<T extends ElementType> = {
  as?: T;
  accent?: GlassAccent;
  highlight?: boolean;
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

export function GlassCard<T extends ElementType = 'div'>({
  as,
  accent,
  highlight = false,
  interactive = false,
  className,
  children,
  ...rest
}: GlassCardProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag
      {...rest}
      className={cn(
        'relative overflow-hidden rounded-[20px] p-6',
        highlight
          ? 'border border-[rgba(212,179,122,0.25)] bg-[linear-gradient(160deg,#1e3a8a,#13294f)] text-[#e8eef9] dark:bg-[linear-gradient(160deg,rgba(30,58,138,0.45),rgba(19,41,79,0.35))]'
          : 'glass',
        interactive &&
          'transition-[transform,opacity] duration-200 ease-out-soft hover:-translate-y-[3px] hover:border-[rgba(212,179,122,0.5)]',
        className,
      )}
    >
      {accent ? (
        <span
          aria-hidden="true"
          data-slot="accent-line"
          className={cn('pointer-events-none absolute inset-x-0 top-0 h-[3px]', ACCENT_LINE[accent])}
        />
      ) : null}
      {children}
    </Tag>
  );
}
