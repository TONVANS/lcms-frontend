import { toStr } from '@/lib/api/envelope';
import { lo } from '@/lib/i18n/lo';
import type { UserRole } from '@/types/domain';
import type { UserFormValues } from '../schemas/user.schema';
import {
  DIVISIONS,
  PERMISSION_KEYS,
  USER_ROLES,
  type AdminUser,
  type HrmEmployee,
  type PermissionFlags,
  type UserCreatePayload,
  type UserUpdatePayload,
} from '../types';

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rec) : {});

function role(v: unknown): UserRole {
  const up = typeof v === 'string' ? v.trim().toUpperCase() : '';
  return USER_ROLES.find((r) => r === up) ?? 'VIEWER';
}

export function toAdminUser(raw: unknown): AdminUser {
  const r = rec(raw);
  return {
    id: toStr(r.id) ?? '',
    employeeCode: toStr(r.employeeCode),
    username: toStr(r.username),
    fullName: toStr(r.fullName) ?? '',
    email: toStr(r.email),
    phone: toStr(r.phone),
    department: toStr(r.department),
    division: toStr(r.division),
    position: toStr(r.position),
    role: role(r.role),
    canView: r.canView === true,
    canUpload: r.canUpload === true,
    canEdit: r.canEdit === true,
    canDelete: r.canDelete === true,
    canDownload: r.canDownload === true,
    isActive: r.isActive === false ? false : true,
    createdAt: toStr(r.createdAt),
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

/** ADMIN and MAIN_USER hold every permission regardless of the individual flags. */
export function impliesAllPermissions(r: UserRole): boolean {
  return r === 'ADMIN' || r === 'MAIN_USER';
}

export function resolveFlags(r: UserRole, flags: PermissionFlags): PermissionFlags {
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
  const out: UserCreatePayload = {
    employeeCode: values.employeeCode.trim(),
    role: values.role,
    ...resolveFlags(values.role, values),
  };
  for (const k of ['division', 'department', 'fullName', 'email', 'phone'] as const) {
    const s = values[k].trim();
    if (s) out[k] = s;
  }
  return out;
}

/** Only the fields that differ from the stored user (UpdateUserDto). */
export function diffUserUpdate(values: UserFormValues, prev: AdminUser): UserUpdatePayload {
  const out: UserUpdatePayload = {};
  if (values.role !== prev.role) out.role = values.role;
  if (values.isActive !== prev.isActive) out.isActive = values.isActive;
  const division = values.division.trim();
  if (division && division !== (prev.division ?? '')) out.division = division;
  const department = values.department.trim();
  if (department && department !== (prev.department ?? '')) out.department = department;
  const flags = resolveFlags(values.role, values);
  for (const k of PERMISSION_KEYS) if (flags[k] !== prev[k]) out[k] = flags[k];
  return out;
}

export function permissionSummary(u: Pick<AdminUser, 'role'> & PermissionFlags): string {
  if (impliesAllPermissions(u.role)) return lo.users.permissionAll;
  const parts = PERMISSION_KEYS.filter((k) => u[k]).map((k) => lo.users.permissions[k]);
  return parts.length ? parts.join(' · ') : lo.users.permissionNone;
}
