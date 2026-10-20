import type { ReactNode } from 'react';
import Link from 'next/link';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/fade-in';
import { lo } from '@/lib/i18n/lo';
import { MODULES } from '@/lib/constants/modules';
import { cn } from '@/lib/utils/cn';
import { daysLeft, formatDate } from '@/lib/utils/date';
import type { Alert } from '@/types/domain';
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

export function UpcomingList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return <EmptyState title={lo.home.noUpcoming} />;
  return (
    <ul className="flex flex-col gap-2">
      {alerts.map((a, i) => {
        const meta = MODULES[a.module];
        return (
          <Row key={a.id} index={i}>
            <Link
              href={meta.href}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] bg-[var(--surface-inset)] px-4 py-3 transition-colors hover:bg-[var(--surface-inset)]/80"
            >
              <span className="min-w-0 flex-1 basis-48 truncate text-sm font-semibold text-text-strong">
                {a.title}
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-[3px] text-xs font-semibold',
                  CHIP_CLASS[a.module],
                )}
              >
                {meta.code}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDate(a.dueDate)}
              </span>
              <CountdownBadge days={daysLeft(a.dueDate)} />
            </Link>
          </Row>
        );
      })}
    </ul>
  );
}
