import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';

export default function PpaDashboardPage() {
  return (
    <>
      <PageHeader eyebrow={MODULES.ppa.code} title={MODULES.ppa.name} accent="ppa" />
      <EmptyState title={lo.common.underConstruction} />
    </>
  );
}
