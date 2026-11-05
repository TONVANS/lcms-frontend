import { toStr } from '@/lib/api/envelope';
import type { ModulePermission, SystemModule, User, UserRole } from '@/types/domain';

function rec(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function toRole(v: unknown): UserRole {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : 'VIEWER';
}

function parseModulePermission(v: unknown): ModulePermission {
  const r = rec(v);
  return {
    canView: r.canView === true,
    canUpload: r.canUpload === true,
    canEdit: r.canEdit === true,
    canDelete: r.canDelete === true,
    canDownload: r.canDownload === true,
  };
}

function buildAdminPermissions(): Record<string, ModulePermission> {
  const full: ModulePermission = {
    canView: true,
    canUpload: true,
    canEdit: true,
    canDelete: true,
    canDownload: true,
  };
  return {
    CONTRACTS: full,
    POWER_CONTRACTS: full,
    LEGAL_AND_DISPUTE: full,
    LEGAL_DOCUMENTS: full,
    LEGAL_CASES: full,
  };
}

function parsePermissionsByModule(
  rawModulePerms: unknown,
  role: string,
): Record<string, ModulePermission> {
  if (role === 'ADMIN') {
    return buildAdminPermissions();
  }

  const result: Record<string, ModulePermission> = {};
  const r = rec(rawModulePerms);

  for (const [key, val] of Object.entries(r)) {
    result[key.toUpperCase()] = parseModulePermission(val);
  }

  // Ensure 3 pillars exist
  if (!result.CONTRACTS) {
    result.CONTRACTS = { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false };
  }
  if (!result.POWER_CONTRACTS) {
    result.POWER_CONTRACTS = { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false };
  }
  if (!result.LEGAL_AND_DISPUTE) {
    // If sub-modules exist, derive from them
    const docsView = result.LEGAL_DOCUMENTS?.canView;
    const casesView = result.LEGAL_CASES?.canView;
    result.LEGAL_AND_DISPUTE = {
      canView: Boolean(docsView || casesView),
      canUpload: Boolean(result.LEGAL_DOCUMENTS?.canUpload || result.LEGAL_CASES?.canUpload),
      canEdit: Boolean(result.LEGAL_DOCUMENTS?.canEdit || result.LEGAL_CASES?.canEdit),
      canDelete: Boolean(result.LEGAL_DOCUMENTS?.canDelete || result.LEGAL_CASES?.canDelete),
      canDownload: Boolean(result.LEGAL_DOCUMENTS?.canDownload || result.LEGAL_CASES?.canDownload),
    };
  } else {
    // Propagate LEGAL_AND_DISPUTE to sub-modules if missing
    if (!result.LEGAL_DOCUMENTS) {
      result.LEGAL_DOCUMENTS = { ...result.LEGAL_AND_DISPUTE };
    }
    if (!result.LEGAL_CASES) {
      result.LEGAL_CASES = { ...result.LEGAL_AND_DISPUTE };
    }
  }

  // Department head default audit permissions (View & Download)
  if (role === 'DEPARTMENT_HEAD') {
    for (const key of ['CONTRACTS', 'POWER_CONTRACTS', 'LEGAL_AND_DISPUTE', 'LEGAL_DOCUMENTS', 'LEGAL_CASES']) {
      result[key] = {
        canView: true,
        canDownload: true,
        canUpload: false,
        canEdit: false,
        canDelete: false,
      };
    }
  }

  return result;
}

function toModules(v: unknown, permissionsByModule: Record<string, ModulePermission>): SystemModule[] {
  const set = new Set<string>();

  if (Array.isArray(v)) {
    for (const item of v) {
      if (typeof item === 'string') {
        set.add(item);
        // Normalize both cases
        set.add(item.toLowerCase());
        set.add(item.toUpperCase());
      }
    }
  }

  // Also include modules where canView is true in permissionsByModule
  for (const [key, perm] of Object.entries(permissionsByModule)) {
    if (perm.canView) {
      set.add(key);
      set.add(key.toLowerCase());
      if (key === 'CONTRACTS') set.add('contracts');
      if (key === 'POWER_CONTRACTS') {
        set.add('power-contracts');
        set.add('ppa');
      }
      if (key === 'LEGAL_AND_DISPUTE') {
        set.add('legal-documents');
        set.add('legal-cases');
        set.add('legal');
      }
    }
  }

  return Array.from(set);
}

/** Tolerant mapper for the backend user profile (login `user` and `/auth/me`). */
export function toUser(raw: unknown): User {
  const r = rec(raw);
  const role = toRole(r.role);
  const permissionsByModule = parsePermissionsByModule(r.permissionsByModule, role);
  const accessibleModules = toModules(r.accessibleModules, permissionsByModule);

  const canView =
    r.canView === true ||
    role === 'ADMIN' ||
    Object.values(permissionsByModule).some((p) => p.canView);
  const canUpload =
    r.canUpload === true ||
    role === 'ADMIN' ||
    Object.values(permissionsByModule).some((p) => p.canUpload);
  const canEdit =
    r.canEdit === true ||
    role === 'ADMIN' ||
    Object.values(permissionsByModule).some((p) => p.canEdit);
  const canDelete =
    r.canDelete === true ||
    role === 'ADMIN' ||
    Object.values(permissionsByModule).some((p) => p.canDelete);
  const canDownload =
    r.canDownload === true ||
    role === 'ADMIN' ||
    role === 'DEPARTMENT_HEAD' ||
    Object.values(permissionsByModule).some((p) => p.canDownload);

  return {
    id: toStr(r.id) ?? toStr(r.userId) ?? '',
    employeeCode: toStr(r.employeeCode) ?? toStr(r.empCode),
    username: toStr(r.username) ?? '',
    fullName: toStr(r.fullName) ?? '',
    email: toStr(r.email),
    phone: toStr(r.phone),
    department: toStr(r.department),
    division: toStr(r.division),
    unit: toStr(r.unit),
    position: toStr(r.position),
    role,
    roleId: toStr(r.roleId),
    roleTitle: toStr(r.roleTitle),
    canView,
    canUpload,
    canEdit,
    canDelete,
    canDownload,
    accessibleModules,
    permissionsByModule,
  };
}
