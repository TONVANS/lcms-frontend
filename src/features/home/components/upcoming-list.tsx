import type { ReactNode } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/fade-in';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { daysLeft, formatDate } from '@/lib/utils/date';
import type { UpcomingItem } from '../types';
import { CHIP_CLASS } from './module-card';

const STAGGER_LIMIT = 10;

// Only the first rows animate; later rows render immediately (Design.md section 8.4).
function Row({ index, children }: { index: number; children: ReactNode }) {
  if (index >= STAGGER_LIMIT) return <li>{children}</li>;
  return (
    <FadeIn as="li" variant="up-sm" index={index}>
      {children}
    </FadeIn>
  );
}

export function UpcomingList({ items }: { items: UpcomingItem[] }) {
  if (items.length === 0) {
    return <EmptyState title={lo.home.noUpcoming} description={lo.home.noUpcomingDesc} />;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((a, i) => {
        const meta = MODULES[a.module];
        const Icon = meta.icon;
        return (
          <Row key={a.key} index={i}>
            <Link
              href={a.href}
              className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[14px] border border-border/40 bg-[var(--surface-inset)]/70 px-4 py-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-[var(--surface-inset)] hover:shadow-sm"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 basis-64">
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold',
                    CHIP_CLASS[a.module],
                  )}
                  title={meta.name}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text-strong transition-colors group-hover:text-primary">
                    {a.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{a.number}</span>
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                  <Calendar aria-hidden="true" className="size-3.5 text-muted-foreground/70" />
                  <span>{formatDate(a.expirationDate)}</span>
                </span>
                <CountdownBadge days={daysLeft(a.expirationDate)} />
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </div>
            </Link>
          </Row>
        );
      })}
    </ul>
  );
}
