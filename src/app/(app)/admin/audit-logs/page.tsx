import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditLogsView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'ບັນທຶກການເຄື່ອນໄຫວລະບົບ (Audit Logs)',
  description: 'ກວດສອບປະຫວັດການດຳເນີນງານ ແລະ ການປ່ຽນແປງຂໍ້ມູນໃນລະບົບ 100%',
};


export default function AdminAuditLogsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <AuditLogsView />
    </Suspense>
  );
}
