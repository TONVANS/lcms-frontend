'use client';

import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/auth';
import type { Role } from '@/types/domain';

interface RoleGateProps {
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ role, children, fallback = null }: RoleGateProps) {
  const user = useAuthStore((s) => s.user);
  const allowed = user !== null && (user.role === 'admin' || user.role === role);
  return <>{allowed ? children : fallback}</>;
}
