import { Suspense } from 'react';
import { ModuleGuard } from '@/components/guards/module-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDocumentsView } from '@/features/legal';

export const instant = false;

export default function LegalRegulationsPage() {
  return (
    <ModuleGuard module="LEGAL_DOCUMENTS">
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
        <LegalDocumentsView />
      </Suspense>
    </ModuleGuard>
  );
}
