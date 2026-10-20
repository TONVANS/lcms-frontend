import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';

export default function ContractsDashboardPage() {
  return (
    <>
      <PageHeader eyebrow={MODULES.gc.code} title={MODULES.gc.name} accent="gc" />
      <EmptyState title={lo.common.underConstruction} />
    </>
  );
}
