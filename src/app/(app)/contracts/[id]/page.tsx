import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { GcContractDetailView } from '@/features/gc';
import { lo } from '@/lib/i18n/lo';

// Data is fetched on the client, so the contract title is not known here.
export const metadata: Metadata = { title: lo.gc.list.title };

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
