import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { GcContractsView } from '@/features/gc';

export const instant = false;

export default function ContractsListPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <GcContractsView />
    </Suspense>
  );
}
