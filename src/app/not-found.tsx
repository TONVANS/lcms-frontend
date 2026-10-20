import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { lo } from '@/lib/i18n/lo';

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        title={lo.errors.pageNotFound}
        action={
          <Button asChild>
            <Link href="/">{lo.common.backHome}</Link>
          </Button>
        }
      />
    </div>
  );
}
