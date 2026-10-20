import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PpaContractsView } from '@/features/ppa';

export default function PpaContractsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <PpaContractsView />
    </Suspense>
  );
}
