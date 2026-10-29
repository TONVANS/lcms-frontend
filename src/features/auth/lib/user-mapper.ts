import { toStr } from '@/lib/api/envelope';
import type { SystemModule, User, UserRole } from '@/types/domain';

const SYSTEM_MODULES: readonly SystemModule[] = [
  'contracts',
  'contract-types',
  'legal-documents',
  'legal-cases',
  'power-contracts',
  'power-notifications',
  'departments',
  'support',
  'users',
  'audit-logs',
];
const ROLES: readonly UserRole[] = ['ADMIN', 'MAIN_USER', 'EDITOR', 'VIEWER'];

function rec(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function toRole(v: unknown): UserRole {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : '';
  return (ROLES as readonly string[]).includes(s) ? (s as UserRole) : 'VIEWER';
}

function toModules(v: unknown): SystemModule[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is SystemModule => (SYSTEM_MODULES as readonly unknown[]).includes(x));
}

/** Tolerant mapper for the backend user profile (login `user` and `/auth/me`). */
export function toUser(raw: unknown): User {
  const r = rec(raw);
  return {
    id: toStr(r.id) ?? '',
    employeeCode: toStr(r.employeeCode),
    username: toStr(r.username) ?? '',
    fullName: toStr(r.fullName) ?? '',
    email: toStr(r.email),
    phone: toStr(r.phone),
    department: toStr(r.department),
    division: toStr(r.division),
    position: toStr(r.position),
    role: toRole(r.role),
    canView: r.canView === true,
    canUpload: r.canUpload === true,
    canEdit: r.canEdit === true,
    canDelete: r.canDelete === true,
    canDownload: r.canDownload === true,
    accessibleModules: toModules(r.accessibleModules),
  };
}
