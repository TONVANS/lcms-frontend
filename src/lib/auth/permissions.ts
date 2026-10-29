import type { ModuleKey, Permission, SystemModule, User } from '@/types/domain';

/** Canonical module order. */
const MODULE_ORDER: readonly ModuleKey[] = ['ppa', 'gc', 'legal'];

/** UI module -> backend system modules that grant access to it. */
const MODULE_SYSTEM: Record<ModuleKey, readonly SystemModule[]> = {
  ppa: ['power-contracts'],
  gc: ['contracts'],
  legal: ['legal-documents', 'legal-cases'],
};

export const MODULE_HOME: Record<ModuleKey, string> = {
  ppa: '/ppa',
  gc: '/contracts',
  legal: '/legal',
};

export function isAdmin(u: User): boolean {
  return u.role === 'ADMIN';
}

/** ADMIN holds every system module; others only those in `accessibleModules`. */
export function hasSystemModule(u: User, m: SystemModule): boolean {
  return isAdmin(u) || u.accessibleModules.includes(m);
}

export function canAccessModule(u: User, m: ModuleKey): boolean {
  return isAdmin(u) || MODULE_SYSTEM[m].some((s) => u.accessibleModules.includes(s));
}

export function getAccessibleModules(u: User): ModuleKey[] {
  return MODULE_ORDER.filter((m) => canAccessModule(u, m));
}

/** Admin or several modules -> Home; one module -> its home; none -> support. */
export function getLandingRoute(u: User): string {
  if (isAdmin(u)) return '/';
  const modules = getAccessibleModules(u);
  if (modules.length > 1) return '/';
  if (modules.length === 1) return MODULE_HOME[modules[0]];
  return '/support';
}

export function hasPermission(u: User, m: ModuleKey, p: Permission): boolean {
  if (!canAccessModule(u, m)) return false;
  if (isAdmin(u) || u.role === 'MAIN_USER') return true;
  switch (p) {
    case 'view':
      return u.canView;
    case 'create':
      return u.canUpload;
    case 'edit':
      return u.canEdit;
    case 'delete':
      return u.canDelete;
    case 'download':
      return u.canDownload;
  }
}
