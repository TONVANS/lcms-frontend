'use client';

import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/auth';
import { isAdmin } from '@/lib/auth/permissions';

interface RoleGateProps {
  /** Only `admin` exists; RoleGate checks `isAdmin`. */
  role: 'admin';
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ children, fallback = null }: RoleGateProps) {
  const user = useAuthStore((s) => s.user);
  const allowed = user !== null && isAdmin(user);
  return <>{allowed ? children : fallback}</>;
}
