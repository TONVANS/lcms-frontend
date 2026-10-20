import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PpaContractDetailView } from '@/features/ppa';

export default async function PpaContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <PpaContractDetailView id={id} />
    </Suspense>
  );
}
