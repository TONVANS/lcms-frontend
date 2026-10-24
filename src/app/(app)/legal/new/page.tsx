import { Suspense } from 'react';
import { PermissionGuard } from '@/components/guards/permission-guard';
import { LegalNewView } from '@/features/legal';

export default function LegalNewPage() {
  return (
    <PermissionGuard module="legal" permission="create">
      <Suspense fallback={null}>
        <LegalNewView />
      </Suspense>
    </PermissionGuard>
  );
}
