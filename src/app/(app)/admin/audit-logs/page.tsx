import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditLogsView } from '@/features/admin';

export const instant = false;

export default function AdminAuditLogsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
      <AuditLogsView />
    </Suspense>
  );
}
