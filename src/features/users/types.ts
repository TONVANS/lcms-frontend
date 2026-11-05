import type { CoreModuleKey, ModulePermission, PermissionActionKey, UserRole } from '@/types/domain';

export const USER_ROLES = [
  'ADMIN',
  'MAIN_USER',
  'DEPARTMENT_HEAD',
  'EDITOR',
  'VIEWER',
] as const satisfies readonly UserRole[];

export const PERMISSION_KEYS: readonly PermissionActionKey[] = [
  'canView',
  'canUpload',
  'canEdit',
  'canDelete',
  'canDownload',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type PermissionFlags = Record<PermissionKey, boolean>;

/** The three divisions accepted by the backend (exact strings). */
export const DIVISIONS = [
  'ພະແນກສັນຍາທົ່ວໄປ',
  'ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ',
  'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ',
] as const;

export interface ModulePermissionDto {
  module: CoreModuleKey | string;
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
}

export interface AdminUser extends PermissionFlags {
  id: string;
  employeeCode: string | null;
  username: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  division: string | null;
  unit?: string | null;
  position: string | null;
  role: string;
  roleId?: string | null;
  roleTitle?: string | null;
  isActive: boolean;
  createdAt: string | null;
  permissionsByModule?: Record<string, ModulePermission>;
  modulePermissions?: ModulePermissionDto[];
}

export interface HrmEmployee {
  employeeCode: string;
  fullName: string | null;
  department: string | null;
  division: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
}

/** CreateUserDto */
export interface UserCreatePayload extends PermissionFlags {
  employeeCode: string;
  role: string;
  division?: string;
  modulePermissions?: ModulePermissionDto[];
}

/** UpdateUserDto */
export interface UserUpdatePayload extends Partial<PermissionFlags> {
  role?: string;
  isActive?: boolean;
  division?: string;
  modulePermissions?: ModulePermissionDto[];
}

export interface ResetPasswordPayload {
  newPassword?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: string;
  isActive?: boolean;
}
