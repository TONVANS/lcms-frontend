import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';
import type { CoreModuleKey, ModulePermission } from '@/types/domain';
import { DIVISIONS, type AdminUser } from '../types';

const v = lo.users.validation;

const optionalText = z.string(v.invalid).trim().max(200, v.textMax);

const modulePermissionShape = z.object({
  canView: z.boolean(),
  canUpload: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canDownload: z.boolean(),
});

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
  role: z.string(v.required).min(1, v.required),
  roleId: z.string().optional(),
  canView: z.boolean(),
  canUpload: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canDownload: z.boolean(),
  isActive: z.boolean(),
  modulePermissions: z.object({
    CONTRACTS: modulePermissionShape,
    POWER_CONTRACTS: modulePermissionShape,
    LEGAL_AND_DISPUTE: modulePermissionShape,
  }),
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
  const emptyPerm: ModulePermission = {
    canView: false,
    canUpload: false,
    canEdit: false,
    canDelete: false,
    canDownload: false,
  };
  return {
    employeeCode: '',
    fullName: '',
    department: '',
    division: '',
    email: '',
    phone: '',
    role: 'VIEWER',
    roleId: undefined,
    canView: false,
    canUpload: false,
    canEdit: false,
    canDelete: false,
    canDownload: false,
    isActive: true,
    modulePermissions: {
      CONTRACTS: { ...emptyPerm },
      POWER_CONTRACTS: { ...emptyPerm },
      LEGAL_AND_DISPUTE: { ...emptyPerm },
    },
  };
}

export function fromAdminUser(u: AdminUser): UserFormValues {
  const getPillarPerm = (key: CoreModuleKey): ModulePermission => {
    if (u.permissionsByModule && u.permissionsByModule[key]) {
      return { ...u.permissionsByModule[key] };
    }
    const found = u.modulePermissions?.find((m) => m.module === key);
    if (found) {
      return {
        canView: found.canView,
        canUpload: found.canUpload,
        canEdit: found.canEdit,
        canDelete: found.canDelete,
        canDownload: found.canDownload,
      };
    }
    if (key === 'LEGAL_AND_DISPUTE') {
      const legalFound =
        u.permissionsByModule?.LEGAL_DOCUMENTS ??
        u.permissionsByModule?.LEGAL_CASES ??
        u.modulePermissions?.find((m) => m.module === 'LEGAL_DOCUMENTS' || m.module === 'LEGAL_CASES');
      if (legalFound) {
        return {
          canView: legalFound.canView,
          canUpload: legalFound.canUpload,
          canEdit: legalFound.canEdit,
          canDelete: legalFound.canDelete,
          canDownload: legalFound.canDownload,
        };
      }
    }
    // Fallback if legacy flat flags
    return {
      canView: u.canView,
      canUpload: u.canUpload,
      canEdit: u.canEdit,
      canDelete: u.canDelete,
      canDownload: u.canDownload,
    };
  };

  return {
    employeeCode: u.employeeCode ?? '',
    fullName: u.fullName,
    department: u.department ?? '',
    division: u.division ?? '',
    email: u.email ?? '',
    phone: u.phone ?? '',
    role: u.role,
    roleId: u.roleId ?? undefined,
    canView: u.canView,
    canUpload: u.canUpload,
    canEdit: u.canEdit,
    canDelete: u.canDelete,
    canDownload: u.canDownload,
    isActive: u.isActive,
    modulePermissions: {
      CONTRACTS: getPillarPerm('CONTRACTS'),
      POWER_CONTRACTS: getPillarPerm('POWER_CONTRACTS'),
      LEGAL_AND_DISPUTE: getPillarPerm('LEGAL_AND_DISPUTE'),
    },
  };
}
