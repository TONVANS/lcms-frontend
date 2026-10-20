'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/features/auth';
import { canAccessModule } from '@/lib/auth/permissions';
import type { ModuleKey } from '@/types/domain';

export function ModuleGuard({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const allowed = user !== null && canAccessModule(user, module);

  useEffect(() => {
    if (!allowed) router.replace('/forbidden');
  }, [allowed, router]);

  return allowed ? <>{children}</> : null;
}
