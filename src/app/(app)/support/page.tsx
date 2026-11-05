import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SupportView } from '@/features/support';

export const metadata: Metadata = {
  title: 'ສູນຊ່ວຍເຫຼືອ ແລະ ຕິດຕໍ່ສອບຖາມ (Support)',
  description: 'ຕິດຕໍ່ຝ່າຍສະໜັບສະໜູນ, ແຈ້ງບັນຫາ ແລະ ສອບຖາມຂໍ້ມູນການໃຊ້ງານລະບົບ EDL LCMS',
};


export default function SupportPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <SupportView />
    </Suspense>
  );
}
