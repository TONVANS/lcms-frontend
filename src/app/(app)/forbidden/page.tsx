import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { lo } from '@/lib/i18n/lo';


export default function ForbiddenPage() {
  return (
    <>
      <PageHeader title={lo.forbidden.title} />
      <EmptyState
        title={lo.errors.forbidden}
        action={
          <Button asChild>
            <Link href="/">{lo.common.backHome}</Link>
          </Button>
        }
      />
    </>
  );
}
