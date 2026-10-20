'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import type { ModuleKey, Permission } from '@/types/domain';
import { useCan } from './can';

// Assumes it is rendered under AuthGate, which never mounts children while auth is loading.
export function PermissionGuard({
  module,
  permission,
  children,
}: {
  module: ModuleKey;
  permission: Permission;
  children: ReactNode;
}) {
  const router = useRouter();
  const allowed = useCan(module, permission);

  useEffect(() => {
    if (!allowed) router.replace('/forbidden');
  }, [allowed, router]);

  return allowed ? <>{children}</> : null;
}
