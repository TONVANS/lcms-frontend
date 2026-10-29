import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalCasesView } from '@/features/legal';

export const instant = false;

export default function LegalCasesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <LegalCasesView />
    </Suspense>
  );
}
