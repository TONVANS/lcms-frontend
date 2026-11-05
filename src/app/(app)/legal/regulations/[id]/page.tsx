import { Suspense } from 'react';
import { ModuleGuard } from '@/components/guards/module-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDocumentDetailView } from '@/features/legal';

export const instant = false;

export default async function RegulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ModuleGuard module="LEGAL_DOCUMENTS">
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
        <LegalDocumentDetailView id={id} />
      </Suspense>
    </ModuleGuard>
  );
}
