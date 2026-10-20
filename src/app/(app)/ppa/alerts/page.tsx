import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PpaAlertsView } from '@/features/ppa';

export default function PpaAlertsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <PpaAlertsView />
    </Suspense>
  );
}
