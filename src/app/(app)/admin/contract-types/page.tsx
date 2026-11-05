import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractTypesView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'ຈັດການປະເພດສັນຍາ (Contract Types)',
  description: 'ຄຸ້ມຄອງ ແລະ ກຳນົດປະເພດສັນຍາຕ່າງໆ ໃນລະບົບ LCMS',
};

export const instant = false;

export default function AdminContractTypesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <ContractTypesView />
    </Suspense>
  );
}
