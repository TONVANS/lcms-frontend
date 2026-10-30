import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SupportView } from '@/features/support';

export const instant = false;

export default function SupportPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <SupportView />
    </Suspense>
  );
}
