import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersView } from '@/features/users';

export const instant = false;

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <UsersView />
    </Suspense>
  );
}
