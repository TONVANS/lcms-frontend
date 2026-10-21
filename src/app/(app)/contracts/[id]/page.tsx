import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { GcContractDetailView } from '@/features/gc';

export default async function GcContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <GcContractDetailView id={id} />
    </Suspense>
  );
}
