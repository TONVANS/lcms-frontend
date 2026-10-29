'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ElementType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { FOCUS_RING } from './detail-bits';

export function SectionHeader({
  id,
  icon: Icon,
  title,
  accent,
  href,
  linkLabel,
}: {
  id: string;
  icon: ElementType;
  title: string;
  accent: 'legal' | 'litigation';
  href: string;
  linkLabel: string;
}) {
  const tint =
    accent === 'legal'
      ? 'border-[var(--legal)]/25 bg-[var(--legal)]/10 text-[var(--legal)]'
      : 'border-[var(--litigation)]/25 bg-[var(--litigation)]/10 text-[var(--litigation)]';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg border', tint)}>
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <h2 id={id} className="font-serif text-lg font-semibold text-[var(--text-strong)]">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-strong)]',
          FOCUS_RING,
        )}
      >
        <span>{linkLabel}</span>
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function SectionSkeleton({ testId }: { testId: string }) {
  return (
    <div data-testid={testId} aria-busy="true" className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-60 rounded-2xl" />
    </div>
  );
}
