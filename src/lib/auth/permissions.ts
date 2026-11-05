import type {
  CoreModuleKey,
  ModuleKey,
  Permission,
  PermissionActionKey,
  SystemModule,
  SystemModuleKey,
  User,
} from '@/types/domain';

/** Canonical module order. */
const MODULE_ORDER: readonly ModuleKey[] = ['ppa', 'gc', 'legal'];

/** UI module -> backend system modules and pillar keys that grant access to it. */
const MODULE_SYSTEM: Record<ModuleKey, readonly string[]> = {
  ppa: ['power-contracts', 'POWER_CONTRACTS', 'ppa'],
  gc: ['contracts', 'CONTRACTS', 'gc'],
  legal: ['legal-documents', 'legal-cases', 'LEGAL_AND_DISPUTE', 'LEGAL_DOCUMENTS', 'LEGAL_CASES', 'legal'],
};

export const MODULE_HOME: Record<ModuleKey, string> = {
  ppa: '/ppa',
  gc: '/contracts',
  legal: '/legal',
};

export function isAdmin(u: User): boolean {
  return u.role === 'ADMIN';
}

export function isDepartmentHead(u: User): boolean {
  return u.role === 'DEPARTMENT_HEAD';
}

export function toActionKey(p: Permission | PermissionActionKey): PermissionActionKey {
  switch (p) {
    case 'view':
    case 'canView':
      return 'canView';
    case 'create':
    case 'canUpload':
      return 'canUpload';
    case 'edit':
    case 'canEdit':
      return 'canEdit';
    case 'delete':
    case 'canDelete':
      return 'canDelete';
    case 'download':
    case 'canDownload':
      return 'canDownload';
    default:
      return 'canView';
  }
}

export function toCoreModuleKey(m: ModuleKey | CoreModuleKey | string): string {
  switch (m) {
    case 'gc':
    case 'contracts':
    case 'CONTRACTS':
      return 'CONTRACTS';
    case 'ppa':
    case 'power-contracts':
    case 'POWER_CONTRACTS':
      return 'POWER_CONTRACTS';
    case 'legal':
    case 'LEGAL_AND_DISPUTE':
      return 'LEGAL_AND_DISPUTE';
    case 'legal-documents':
    case 'LEGAL_DOCUMENTS':
      return 'LEGAL_DOCUMENTS';
    case 'legal-cases':
    case 'LEGAL_CASES':
      return 'LEGAL_CASES';
    default:
      return String(m).toUpperCase();
  }
}

/** ADMIN holds every system module; others check permissionsByModule and accessibleModules. */
export function hasSystemModule(u: User, m: SystemModule): boolean {
  if (isAdmin(u)) return true;
  return canAccessModule(u, m);
}

export function canAccessModule(u: User, m: ModuleKey | CoreModuleKey | string): boolean {
  if (isAdmin(u)) return true;

  const coreKey = toCoreModuleKey(m);

  if (coreKey === 'LEGAL_DOCUMENTS') {
    return Boolean(
      u.permissionsByModule?.LEGAL_DOCUMENTS?.canView ??
      u.permissionsByModule?.LEGAL_AND_DISPUTE?.canView ??
      u.accessibleModules.some((s) => s.toLowerCase() === 'legal-documents' || s === 'LEGAL_DOCUMENTS'),
    );
  }
  if (coreKey === 'LEGAL_CASES') {
    return Boolean(
      u.permissionsByModule?.LEGAL_CASES?.canView ??
      u.permissionsByModule?.LEGAL_AND_DISPUTE?.canView ??
      u.accessibleModules.some((s) => s.toLowerCase() === 'legal-cases' || s === 'LEGAL_CASES'),
    );
  }

  if (u.permissionsByModule?.[coreKey]?.canView) {
    return true;
  }

  // Check sub-modules for legal
  if (coreKey === 'LEGAL_AND_DISPUTE') {
    if (
      u.permissionsByModule?.LEGAL_DOCUMENTS?.canView ||
      u.permissionsByModule?.LEGAL_CASES?.canView
    ) {
      return true;
    }
  }

  // Check accessibleModules
  const candidates =
    (m in MODULE_SYSTEM ? MODULE_SYSTEM[m as ModuleKey] : [m, coreKey, String(m).toLowerCase()]);
  return candidates.some((s) => u.accessibleModules.includes(s));
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

export function hasPermission(
  u: User,
  m: ModuleKey | CoreModuleKey | SystemModuleKey,
  p: Permission | PermissionActionKey,
): boolean {
  if (isAdmin(u)) return true;

  const actionKey = toActionKey(p);
  const coreKey = toCoreModuleKey(m);

  // DEPARTMENT_HEAD has read-only audit: canView and canDownload only
  if (isDepartmentHead(u)) {
    if (actionKey === 'canView' || actionKey === 'canDownload') {
      return canAccessModule(u, m);
    }
    return false;
  }

  if (u.permissionsByModule) {
    const modPerm = u.permissionsByModule[coreKey];
    if (modPerm !== undefined) {
      return Boolean(modPerm[actionKey]);
    }

    // If querying specific sub-modules
    const rawKey = String(m).toUpperCase();
    if (u.permissionsByModule[rawKey] !== undefined) {
      return Boolean(u.permissionsByModule[rawKey][actionKey]);
    }
  }

  if (!canAccessModule(u, m)) return false;

  if (u.role === 'MAIN_USER') return true;

  switch (actionKey) {
    case 'canView':
      return u.canView;
    case 'canUpload':
      return u.canUpload;
    case 'canEdit':
      return u.canEdit;
    case 'canDelete':
      return u.canDelete;
    case 'canDownload':
      return u.canDownload;
  }
}

/** URL path prefix mapping to backend pillar modules */
const MODULE_PATH_MAP: Record<string, CoreModuleKey> = {
  '/contracts': 'CONTRACTS',
  '/power-contracts': 'POWER_CONTRACTS',
  '/ppa': 'POWER_CONTRACTS',
  '/legal-documents': 'LEGAL_AND_DISPUTE',
  '/legal-cases': 'LEGAL_AND_DISPUTE',
  '/legal': 'LEGAL_AND_DISPUTE',
};

/**
 * Route guard helper for Next.js / layout checks.
 */
export function checkPageAccess(pathname: string, user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;

  if (pathname.startsWith('/admin')) {
    return false;
  }

  const matchedPrefix = Object.keys(MODULE_PATH_MAP).find((prefix) => pathname.startsWith(prefix));
  if (!matchedPrefix) return true; // General pages: home, notifications, support

  const targetModule = MODULE_PATH_MAP[matchedPrefix];
  return hasPermission(user, targetModule, 'canView');
}
