import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { GcAlertsView } from '@/features/gc';

export const instant = false;

export default function ContractsAlertsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <GcAlertsView />
    </Suspense>
  );
}
