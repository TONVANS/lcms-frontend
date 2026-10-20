import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { lo } from '@/lib/i18n/lo';

// Temporary placeholder; the Home launcher replaces it.
export default function HomePage() {
  return (
    <>
      <PageHeader title={lo.common.home} />
      <EmptyState title={lo.common.underConstruction} />
    </>
  );
}
