import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RegulationDetailView } from '@/features/legal';

export const instant = false;

export default async function RegulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <RegulationDetailView id={id} />
    </Suspense>
  );
}
