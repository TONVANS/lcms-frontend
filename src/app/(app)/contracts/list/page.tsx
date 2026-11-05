import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { GcContractsView } from '@/features/gc';

export const metadata: Metadata = {
  title: 'ລາຍການສັນຍາທົ່ວໄປ (GC)',
  description:
    'ຄຸ້ມຄອງ, ຄົ້ນຫາ ແລະ ກວດສອບລາຍການສັນຍາທົ່ວໄປ ແລະ ຈັດຊື້-ຈັດຈ້າງທັງໝົດ',
};


export default function ContractsListPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <GcContractsView />
    </Suspense>
  );
}
