import type { ModuleKey, ModuleRole, Permission, User } from '@/types/domain';
import { ROLE_PERMISSIONS } from './roles';

const ALL_MODULES: ModuleKey[] = ['ppa', 'gc', 'legal'];

export const MODULE_HOME: Record<ModuleKey, string> = {
  ppa: '/ppa',
  gc: '/contracts',
  legal: '/legal',
};

export function getAccessibleModules(u: User): ModuleKey[] {
  return u.role === 'admin' ? [...ALL_MODULES] : u.modules;
}

export function canAccessModule(u: User, m: ModuleKey): boolean {
  return u.role === 'admin' || u.modules.includes(m);
}

export function getLandingRoute(u: User): string {
  if (u.role === 'admin') return '/';
  if (u.modules.length > 1) return '/';
  if (u.modules.length === 1) return MODULE_HOME[u.modules[0]];
  return '/forbidden';
}

export function getModuleRole(u: User, m: ModuleKey): ModuleRole | null {
  if (u.role === 'admin') return 'main';
  if (!canAccessModule(u, m)) return null;
  return u.moduleRoles[m] ?? 'viewer';
}

export function hasPermission(u: User, m: ModuleKey, p: Permission): boolean {
  const role = getModuleRole(u, m);
  if (role === null) return false;
  if (u.role === 'admin') return true;
  return ROLE_PERMISSIONS[role].includes(p);
}
