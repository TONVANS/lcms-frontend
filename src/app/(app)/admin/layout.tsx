'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { RoleGate } from '@/components/guards/role-gate';
import { useAuthStore } from '@/features/auth';
import { isAdmin } from '@/lib/auth/permissions';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const allowed = user !== null && isAdmin(user);

  useEffect(() => {
    if (!allowed) router.replace('/forbidden');
  }, [allowed, router]);

  return <RoleGate role="admin">{children}</RoleGate>;
}
