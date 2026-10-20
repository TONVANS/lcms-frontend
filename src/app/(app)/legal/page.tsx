import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';

export default function LegalDashboardPage() {
  return (
    <>
      <PageHeader eyebrow={MODULES.legal.code} title={MODULES.legal.name} accent="legal" />
      <EmptyState title={lo.common.underConstruction} />
    </>
  );
}
