'use client';

import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/auth';
import { hasPermission } from '@/lib/auth/permissions';
import type { ModuleKey, Permission } from '@/types/domain';

export function useCan(module: ModuleKey, permission: Permission): boolean {
  const user = useAuthStore((s) => s.user);
  return user !== null && hasPermission(user, module, permission);
}

export function Can({
  module,
  permission,
  fallback = null,
  children,
}: {
  module: ModuleKey;
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = useCan(module, permission);
  return <>{allowed ? children : fallback}</>;
}
