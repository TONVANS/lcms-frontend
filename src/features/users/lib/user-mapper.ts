import { toStr } from '@/lib/api/envelope';
import { lo } from '@/lib/i18n/lo';
import type { ModulePermission } from '@/types/domain';
import type { UserFormValues } from '../schemas/user.schema';
import {
  DIVISIONS,
  PERMISSION_KEYS,
  type AdminUser,
  type HrmEmployee,
  type ModulePermissionDto,
  type PermissionFlags,
  type UserCreatePayload,
  type UserUpdatePayload,
} from '../types';

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rec) : {});

function parseModulePerm(v: unknown): ModulePermission {
  const r = rec(v);
  return {
    canView: r.canView === true,
    canUpload: r.canUpload === true,
    canEdit: r.canEdit === true,
    canDelete: r.canDelete === true,
    canDownload: r.canDownload === true,
  };
}

export function toAdminUser(raw: unknown): AdminUser {
  const r = rec(raw);
  const role = toStr(r.role) ?? 'VIEWER';

  // Parse permissionsByModule
  let permissionsByModule: Record<string, ModulePermission> | undefined;
  if (r.permissionsByModule && typeof r.permissionsByModule === 'object') {
    permissionsByModule = {};
    for (const [k, v] of Object.entries(r.permissionsByModule as Record<string, unknown>)) {
      permissionsByModule[k.toUpperCase()] = parseModulePerm(v);
    }
  }

  // Parse modulePermissions array
  let modulePermissions: ModulePermissionDto[] | undefined;
  if (Array.isArray(r.modulePermissions)) {
    modulePermissions = r.modulePermissions.map((item) => {
      const it = rec(item);
      return {
        module: toStr(it.module) ?? '',
        ...parseModulePerm(it),
      };
    });
  }

  return {
    id: toStr(r.id) ?? '',
    employeeCode: toStr(r.employeeCode),
    username: toStr(r.username),
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
    canView: r.canView === true,
    canUpload: r.canUpload === true,
    canEdit: r.canEdit === true,
    canDelete: r.canDelete === true,
    canDownload: r.canDownload === true,
    isActive: r.isActive === false ? false : true,
    createdAt: toStr(r.createdAt),
    permissionsByModule,
    modulePermissions,
  };
}

export function toHrmEmployee(raw: unknown, requestedCode = ''): HrmEmployee {
  const r = rec(raw);
  const joined = [toStr(r.firstName), toStr(r.lastName)].filter(Boolean).join(' ');
  return {
    employeeCode: toStr(r.employeeCode) ?? toStr(r.empCode) ?? requestedCode,
    fullName: toStr(r.fullName) ?? toStr(r.name) ?? (joined || null),
    department: toStr(r.department),
    division: toStr(r.division),
    position: toStr(r.position),
    email: toStr(r.email),
    phone: toStr(r.phone),
  };
}

/** Form fields an HRM profile can fill; empty values and unknown divisions are skipped. */
export function hrmToFormPatch(
  e: HrmEmployee,
): Partial<Pick<UserFormValues, 'fullName' | 'department' | 'division' | 'email' | 'phone'>> {
  const out: Partial<Pick<UserFormValues, 'fullName' | 'department' | 'division' | 'email' | 'phone'>> = {};
  if (e.fullName) out.fullName = e.fullName;
  if (e.department) out.department = e.department;
  if (e.division && (DIVISIONS as readonly string[]).includes(e.division)) out.division = e.division;
  if (e.email) out.email = e.email;
  if (e.phone) out.phone = e.phone;
  return out;
}

/** ADMIN and MAIN_USER hold full permissions */
export function impliesAllPermissions(r: string): boolean {
  return r === 'ADMIN' || r === 'MAIN_USER';
}

export function resolveFlags(r: string, flags: PermissionFlags): PermissionFlags {
  if (impliesAllPermissions(r)) {
    return { canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true };
  }
  return {
    canView: flags.canView,
    canUpload: flags.canUpload,
    canEdit: flags.canEdit,
    canDelete: flags.canDelete,
    canDownload: flags.canDownload,
  };
}

export function toCreatePayload(values: UserFormValues): UserCreatePayload {
  const legal = values.modulePermissions.LEGAL_AND_DISPUTE;
  const candidates: ModulePermissionDto[] = [
    { module: 'CONTRACTS', ...values.modulePermissions.CONTRACTS },
    { module: 'POWER_CONTRACTS', ...values.modulePermissions.POWER_CONTRACTS },
    { module: 'LEGAL_DOCUMENTS', ...legal },
    { module: 'LEGAL_CASES', ...legal },
  ];

  // Include only modules that have at least one permission granted
  const modulePermissions = candidates.filter(
    (m) => m.canView || m.canUpload || m.canEdit || m.canDelete || m.canDownload,
  );

  const anyCanView = modulePermissions.some((m) => m.canView);
  const anyCanUpload = modulePermissions.some((m) => m.canUpload);
  const anyCanEdit = modulePermissions.some((m) => m.canEdit);
  const anyCanDelete = modulePermissions.some((m) => m.canDelete);
  const anyCanDownload = modulePermissions.some((m) => m.canDownload);

  const flags = resolveFlags(values.role, {
    canView: anyCanView || values.canView,
    canUpload: anyCanUpload || values.canUpload,
    canEdit: anyCanEdit || values.canEdit,
    canDelete: anyCanDelete || values.canDelete,
    canDownload: anyCanDownload || values.canDownload,
  });

  const out: UserCreatePayload = {
    employeeCode: values.employeeCode.trim(),
    role: values.role,
    canView: flags.canView,
    canUpload: flags.canUpload,
    canEdit: flags.canEdit,
    canDelete: flags.canDelete,
    canDownload: flags.canDownload,
    modulePermissions,
  };

  const division = values.division?.trim();
  if (division && division !== '__none__') {
    out.division = division;
  }

  return out;
}

/** Only the fields that differ from the stored user (UpdateUserDto). */
export function diffUserUpdate(values: UserFormValues, prev: AdminUser): UserUpdatePayload {
  const legal = values.modulePermissions.LEGAL_AND_DISPUTE;
  const candidates: ModulePermissionDto[] = [
    { module: 'CONTRACTS', ...values.modulePermissions.CONTRACTS },
    { module: 'POWER_CONTRACTS', ...values.modulePermissions.POWER_CONTRACTS },
    { module: 'LEGAL_DOCUMENTS', ...legal },
    { module: 'LEGAL_CASES', ...legal },
  ];

  const modulePermissions = candidates.filter(
    (m) => m.canView || m.canUpload || m.canEdit || m.canDelete || m.canDownload,
  );

  const anyCanView = modulePermissions.some((m) => m.canView);
  const anyCanUpload = modulePermissions.some((m) => m.canUpload);
  const anyCanEdit = modulePermissions.some((m) => m.canEdit);
  const anyCanDelete = modulePermissions.some((m) => m.canDelete);
  const anyCanDownload = modulePermissions.some((m) => m.canDownload);

  const flags = resolveFlags(values.role, {
    canView: anyCanView || values.canView,
    canUpload: anyCanUpload || values.canUpload,
    canEdit: anyCanEdit || values.canEdit,
    canDelete: anyCanDelete || values.canDelete,
    canDownload: anyCanDownload || values.canDownload,
  });

  const out: UserUpdatePayload = {
    role: values.role,
    isActive: values.isActive,
    canView: flags.canView,
    canUpload: flags.canUpload,
    canEdit: flags.canEdit,
    canDelete: flags.canDelete,
    canDownload: flags.canDownload,
    modulePermissions,
  };

  const division = values.division?.trim();
  if (division && division !== '__none__' && division !== (prev.division ?? '')) {
    out.division = division;
  }

  return out;
}

export function permissionSummary(u: AdminUser): string {
  if (impliesAllPermissions(u.role)) return lo.users.permissionAll;

  if (u.permissionsByModule) {
    const activePillars: string[] = [];
    if (u.permissionsByModule.CONTRACTS?.canView) activePillars.push('ສັນຍາທົ່ວໄປ');
    if (u.permissionsByModule.POWER_CONTRACTS?.canView) activePillars.push('ສັນຍາໄຟຟ້າ');
    if (u.permissionsByModule.LEGAL_AND_DISPUTE?.canView || u.permissionsByModule.LEGAL_DOCUMENTS?.canView || u.permissionsByModule.LEGAL_CASES?.canView) {
      activePillars.push('ນິຕິກຳ/ຄະດີ');
    }
    if (activePillars.length > 0) {
      return activePillars.join(', ');
    }
  }

  const parts = PERMISSION_KEYS.filter((k) => u[k]).map((k) => lo.users.permissions[k]);
  return parts.length ? parts.join(' · ') : lo.users.permissionNone;
}
