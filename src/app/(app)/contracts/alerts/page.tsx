import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { GcAlertsView } from '@/features/gc';

export const metadata: Metadata = {
  title: 'ແຈ້ງເຕືອນສັນຍາທົ່ວໄປ',
  description:
    'ລາຍການແຈ້ງເຕືອນສັນຍາທົ່ວໄປໃກ້ໝົດອາຍຸ ແລະ ກຳນົດເວລາພັນທະສັນຍາ',
};


export default function ContractsAlertsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <GcAlertsView />
    </Suspense>
  );
}
