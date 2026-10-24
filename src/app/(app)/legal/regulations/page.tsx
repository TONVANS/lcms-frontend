import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RegulationsView } from '@/features/legal';

export const instant = false;

export default function LegalRegulationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <RegulationsView />
    </Suspense>
  );
}
