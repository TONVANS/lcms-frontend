'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { AlertBanner } from '@/components/shared/alert-banner';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { lo } from '@/lib/i18n/lo';

export function ActiveBadge({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) {
  return <StatusBadge tone={active ? 'emerald' : 'slate'} label={active ? activeLabel : inactiveLabel} />;
}

export function RowActions({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button type="button" variant="ghost" size="icon" aria-label={editLabel} onClick={onEdit}>
        <Pencil aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label={deleteLabel} onClick={onDelete}>
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}

/** Error banner with retry, or the children; announces the loading state to assistive tech. */
export function ListSection({
  isLoading,
  error,
  errorTitle,
  onRetry,
  children,
}: {
  isLoading: boolean;
  error: string | null;
  errorTitle: string;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (error) {
    return (
      <AlertBanner
        tone="rose"
        title={errorTitle}
        description={error}
        action={
          <Button type="button" variant="secondary" onClick={onRetry}>
            {lo.common.retry}
          </Button>
        }
      />
    );
  }
  return (
    <div aria-busy={isLoading}>
      {isLoading ? <span role="status" aria-label={lo.common.loading} className="sr-only" /> : null}
      {children}
    </div>
  );
}
