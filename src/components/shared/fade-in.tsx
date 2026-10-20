import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

const VARIANT_CLASS = {
  in: 'animate-fade-in',
  up: 'animate-fade-in-up',
  'up-sm': 'animate-fade-in-up-sm',
  scale: 'animate-fade-in-scale',
  down: 'animate-fade-in-down',
  hero: 'animate-fade-in-hero',
} as const;

export type FadeInVariant = keyof typeof VARIANT_CLASS;

interface FadeInProps {
  as?: ElementType;
  variant?: FadeInVariant;
  index?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function FadeIn({
  as: Tag = 'div',
  variant = 'up',
  index,
  className,
  style,
  children,
}: FadeInProps) {
  const hasIndex = index !== undefined;
  return (
    <Tag
      className={cn(VARIANT_CLASS[variant], hasIndex && 'stagger', className)}
      style={hasIndex ? ({ ...style, '--i': index } as CSSProperties) : style}
    >
      {children}
    </Tag>
  );
}
