import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';
import type { UserRole } from '@/types/domain';
import { DIVISIONS, USER_ROLES, type AdminUser } from '../types';

const v = lo.users.validation;

const optionalText = z.string(v.invalid).trim().max(200, v.textMax);

const shape = {
  fullName: optionalText,
  department: optionalText,
  division: z
    .string(v.invalid)
    .refine((s) => s === '' || (DIVISIONS as readonly string[]).includes(s), v.divisionInvalid),
  email: z
    .string(v.invalid)
    .trim()
    .max(200, v.textMax)
    .refine((s) => s === '' || z.email().safeParse(s).success, v.emailInvalid),
  phone: z
    .string(v.invalid)
    .trim()
    .max(30, v.textMax)
    .refine((s) => s === '' || /^\+?[0-9][0-9\s-]{3,}$/.test(s), v.phoneInvalid),
  role: z.enum(USER_ROLES, { message: v.required }),
  canView: z.boolean(),
  canUpload: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canDownload: z.boolean(),
  isActive: z.boolean(),
};

export const userCreateSchema = z.object(
  {
    employeeCode: z
      .string(v.required)
      .trim()
      .min(1, v.required)
      .max(50, v.textMax)
      .regex(/^[A-Za-z0-9_-]+$/, v.employeeCodeFormat),
    ...shape,
  },
  v.invalid,
);

/** Edit never changes the employee code, so it is not validated. */
export const userEditSchema = z.object({ employeeCode: z.string(), ...shape }, v.invalid);

export type UserFormValues = z.infer<typeof userCreateSchema>;

export function emptyUserForm(): UserFormValues {
  return {
    employeeCode: '',
    fullName: '',
    department: '',
    division: '',
    email: '',
    phone: '',
    role: 'VIEWER' as UserRole,
    canView: true,
    canUpload: false,
    canEdit: false,
    canDelete: false,
    canDownload: false,
    isActive: true,
  };
}

export function fromAdminUser(u: AdminUser): UserFormValues {
  return {
    employeeCode: u.employeeCode ?? '',
    fullName: u.fullName,
    department: u.department ?? '',
    division: u.division ?? '',
    email: u.email ?? '',
    phone: u.phone ?? '',
    role: u.role,
    canView: u.canView,
    canUpload: u.canUpload,
    canEdit: u.canEdit,
    canDelete: u.canDelete,
    canDownload: u.canDownload,
    isActive: u.isActive,
  };
}
