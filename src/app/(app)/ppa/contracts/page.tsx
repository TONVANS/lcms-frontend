import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PpaContractsView } from '@/features/ppa';

export const metadata: Metadata = {
  title: 'ລາຍການສັນຍາຊື້-ຂາຍໄຟຟ້າ (PPA)',
  description:
    'ຄຸ້ມຄອງ, ຄົ້ນຫາ ແລະ ກວດສອບລາຍການສັນຍາຊື້-ຂາຍໄຟຟ້າທັງໝົດໃນລະບົບ',
};

export const instant = false;

export default function PpaContractsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <PpaContractsView />
    </Suspense>
  );
}
