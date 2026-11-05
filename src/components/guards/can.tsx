'use client';

import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/auth';
import { hasPermission } from '@/lib/auth/permissions';
import type {
  CoreModuleKey,
  ModuleKey,
  Permission,
  PermissionActionKey,
  SystemModuleKey,
} from '@/types/domain';

export function useCan(
  module: ModuleKey | CoreModuleKey | SystemModuleKey,
  permission: Permission | PermissionActionKey,
): boolean {
  const user = useAuthStore((s) => s.user);
  return user !== null && hasPermission(user, module, permission);
}

export function Can({
  module,
  permission,
  fallback = null,
  children,
}: {
  module: ModuleKey | CoreModuleKey | SystemModuleKey;
  permission: Permission | PermissionActionKey;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = useCan(module, permission);
  return <>{allowed ? children : fallback}</>;
}
