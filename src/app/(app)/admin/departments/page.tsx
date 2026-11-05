import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DepartmentsView } from '@/features/admin';

export const metadata: Metadata = {
  title: 'ຈັດການພະແນກ (Departments)',
  description: 'ຄຸ້ມຄອງໂຄງສ້າງພະແນກ ແລະ ຝ່າຍຕ່າງໆ ຂອງ ລັດວິສາຫະກິດໄຟຟ້າລາວ',
};


export default function AdminDepartmentsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <DepartmentsView />
    </Suspense>
  );
}
