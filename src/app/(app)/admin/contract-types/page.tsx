import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractTypesView } from '@/features/admin';

export const instant = false;

export default function AdminContractTypesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <ContractTypesView />
    </Suspense>
  );
}
