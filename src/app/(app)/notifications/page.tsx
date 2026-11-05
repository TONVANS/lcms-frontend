import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationsView } from '@/features/notifications';

export const metadata: Metadata = {
  title: 'ການແຈ້ງເຕືອນ (Notifications)',
  description: 'ສູນກາງການແຈ້ງເຕືອນທັງໝົດໃນລະບົບ EDL LCMS',
};


export default function NotificationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <NotificationsView />
    </Suspense>
  );
}
