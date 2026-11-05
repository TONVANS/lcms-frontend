import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ModuleGuard } from '@/components/guards/module-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDocumentsView } from '@/features/legal';

export const metadata: Metadata = {
  title: 'ລະບຽບກົດໝາຍ ແລະ ນິຕິກຳ (Regulations)',
  description:
    'ຄັງເກັບກຳ ແລະ ຄົ້ນຫາລະບຽບກົດໝາຍ, ນິຕິກຳ ແລະ ຂໍ້ຕົກລົງຕ່າງໆ',
};


export default function LegalRegulationsPage() {
  return (
    <ModuleGuard module="LEGAL_DOCUMENTS">
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
        <LegalDocumentsView />
      </Suspense>
    </ModuleGuard>
  );
}
