import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { lo } from '@/lib/i18n/lo';

export default function AdminContractTypesPage() {
  return (
    <>
      <PageHeader title={lo.admin.contractTypes} />
      <EmptyState title={lo.common.underConstruction} />
    </>
  );
}
