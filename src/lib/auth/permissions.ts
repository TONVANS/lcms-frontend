import type { ModuleKey, Permission, User } from '@/types/domain';

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

export function hasPermission(u: User, m: ModuleKey, p: Permission): boolean {
  if (u.role === 'admin') return true;
  if (!canAccessModule(u, m)) return false;
  if (u.permissions === undefined) return p === 'view';
  return u.permissions[m]?.includes(p) ?? false;
}
