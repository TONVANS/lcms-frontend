import { Suspense } from 'react';
import { ModuleGuard } from '@/components/guards/module-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalCasesView } from '@/features/legal';

export const instant = false;

export default function LegalCasesPage() {
  return (
    <ModuleGuard module="LEGAL_CASES">
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
        <LegalCasesView />
      </Suspense>
    </ModuleGuard>
  );
}
