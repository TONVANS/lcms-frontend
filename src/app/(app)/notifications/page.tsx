import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { lo } from '@/lib/i18n/lo';

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title={lo.topbar.notifications} />
      <EmptyState title={lo.common.underConstruction} />
    </>
  );
}
