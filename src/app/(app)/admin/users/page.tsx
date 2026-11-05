import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersView } from '@/features/users';

export const metadata: Metadata = {
  title: 'ຈັດການຜູ້ໃຊ້ງານ (Users)',
  description: 'ຄຸ້ມຄອງ ແລະ ກຳນົດສິດທິບັນຊີຜູ້ໃຊ້ງານໃນລະບົບ LCMS',
};


export default function AdminUsersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <UsersView />
    </Suspense>
  );
}
