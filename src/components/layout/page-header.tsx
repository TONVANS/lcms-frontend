import type { ReactNode } from 'react';
import type { ModuleKey } from '@/types/domain';
import { cn } from '@/lib/utils/cn';

const EYEBROW_CLASS: Record<ModuleKey, string> = {
  ppa: 'text-ppa',
  gc: 'text-gc',
  legal: 'text-legal',
};

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  accent?: ModuleKey;
}

export function PageHeader({ eyebrow, title, meta, actions, accent }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p
            className={cn(
              'mb-1 text-xs font-semibold tracking-[0.14em] uppercase',
              accent ? EYEBROW_CLASS[accent] : 'text-gold',
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-serif text-[34px] leading-[1.35] font-semibold text-text-strong">
          {title}
        </h1>
        {meta ? <div className="mt-1 text-[13px] text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
