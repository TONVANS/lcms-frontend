import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PermissionGuard } from '@/components/guards/permission-guard';
import { LegalNewView } from '@/features/legal';

export const metadata: Metadata = {
  title: 'ເພີ່ມຂໍ້ມູນນິຕິກຳ / ຄະດີໃໝ່',
  description: 'ສ້າງ ແລະ ລົງທະບຽນຂໍ້ມູນນິຕິກຳ ຫຼື ຄະດີຄວາມໃໝ່',
};


export default function LegalNewPage() {
  return (
    <PermissionGuard module="legal" permission="create">
      <Suspense fallback={null}>
        <LegalNewView />
      </Suspense>
    </PermissionGuard>
  );
}
