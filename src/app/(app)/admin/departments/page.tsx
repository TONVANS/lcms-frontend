import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DepartmentsView } from '@/features/admin';

export const instant = false;

export default function AdminDepartmentsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <DepartmentsView />
    </Suspense>
  );
}
