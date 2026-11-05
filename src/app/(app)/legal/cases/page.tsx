import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ModuleGuard } from '@/components/guards/module-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalCasesView } from '@/features/legal';

export const metadata: Metadata = {
  title: 'ຄະດີຄວາມ ແລະ ຂໍ້ຂັດແຍ່ງ (Litigation & Cases)',
  description:
    'ຕິດຕາມຄວາມຄືບໜ້າຄະດີຄວາມ, ການໄຕ່ສວນສານ ແລະ ການແກ້ໄຂຂໍ້ຂັດແຍ່ງ',
};

export const instant = false;

export default function LegalCasesPage() {
  return (
    <ModuleGuard module="LEGAL_CASES">
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
        <LegalCasesView />
      </Suspense>
    </ModuleGuard>
  );
}
