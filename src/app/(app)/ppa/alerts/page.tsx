import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PpaAlertsView } from '@/features/ppa';

export const metadata: Metadata = {
  title: 'ແຈ້ງເຕືອນສັນຍາ PPA',
  description:
    'ລາຍການແຈ້ງເຕືອນສັນຍາຊື້-ຂາຍໄຟຟ້າໃກ້ໝົດອາຍຸ ແລະ ກຳນົດເວລາສຳຄັນ 90/30/7 ມື້',
};

export const instant = false;

export default function PpaAlertsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <PpaAlertsView />
    </Suspense>
  );
}
