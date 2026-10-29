import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { lo } from '@/lib/i18n/lo';

export default function SupportPage() {
  return (
    <>
      <PageHeader title={lo.support.title} />
      <EmptyState title={lo.common.underConstruction} />
    </>
  );
}
