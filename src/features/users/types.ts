import type { UserRole } from '@/types/domain';

export const USER_ROLES = ['ADMIN', 'MAIN_USER', 'EDITOR', 'VIEWER'] as const satisfies readonly UserRole[];

export const PERMISSION_KEYS = ['canView', 'canUpload', 'canEdit', 'canDelete', 'canDownload'] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type PermissionFlags = Record<PermissionKey, boolean>;

/** The three divisions accepted by the backend (exact strings). */
export const DIVISIONS = [
  'ພະແນກສັນຍາທົ່ວໄປ',
  'ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ',
  'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ',
] as const;

export interface AdminUser extends PermissionFlags {
  id: string;
  employeeCode: string | null;
  username: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  division: string | null;
  position: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string | null;
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
  role: UserRole;
  division?: string;
  department?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

/** UpdateUserDto */
export type UserUpdatePayload = Partial<PermissionFlags> & {
  role?: UserRole;
  isActive?: boolean;
  division?: string;
  department?: string;
};

export interface UserListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: UserRole;
  isActive?: boolean;
}
