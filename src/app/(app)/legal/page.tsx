import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDashboardView } from '@/features/legal';

export const metadata: Metadata = {
  title: 'ນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (Legal)',
  description:
    'ພາບລວມວຽກງານນິຕິກຳ, ຄຸ້ມຄອງລະບຽບກົດໝາຍ ແລະ ຕິດຕາມຄະດີຄວາມ',
};

export const instant = false;

export default function LegalDashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <LegalDashboardView />
    </Suspense>
  );
}
