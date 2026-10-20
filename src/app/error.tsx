'use client';

import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { lo } from '@/lib/i18n/lo';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        title={lo.errors.unknown}
        action={<Button onClick={() => reset()}>{lo.common.retry}</Button>}
      />
    </div>
  );
}
