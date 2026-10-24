import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDashboardView } from '@/features/legal';

export const instant = false;

export default function LegalDashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <LegalDashboardView />
    </Suspense>
  );
}
