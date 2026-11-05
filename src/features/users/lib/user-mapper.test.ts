import { describe, expect, it } from 'vitest';
import type { UserFormValues } from '../schemas/user.schema';
import type { AdminUser } from '../types';
import { diffUserUpdate, permissionSummary, toAdminUser, toCreatePayload } from './user-mapper';

describe('User Mapper with 3 Core Pillars Matrix', () => {
  it('maps raw backend user into AdminUser with permissionsByModule', () => {
    const raw = {
      id: 'usr-1',
      employeeCode: 'EDL-001',
      fullName: 'John Doe',
      role: 'POWER_AUDITOR',
      roleId: 'role-123',
      roleTitle: 'ນາຍຊ່າງກວດສອບສັນຍາໄຟຟ້າ',
      permissionsByModule: {
        POWER_CONTRACTS: { canView: true, canUpload: true, canEdit: false, canDelete: false, canDownload: true },
      },
    };

    const user = toAdminUser(raw);
    expect(user.id).toBe('usr-1');
    expect(user.role).toBe('POWER_AUDITOR');
    expect(user.roleId).toBe('role-123');
    expect(user.roleTitle).toBe('ນາຍຊ່າງກວດສອບສັນຍາໄຟຟ້າ');
    expect(user.permissionsByModule?.POWER_CONTRACTS.canView).toBe(true);
    expect(user.permissionsByModule?.POWER_CONTRACTS.canUpload).toBe(true);
  });

  it('builds CreatePayload with valid modulePermissions (no extra fields, no LEGAL_AND_DISPUTE key)', () => {
    const formValues: UserFormValues = {
      employeeCode: 'EDL-44652',
      fullName: 'ສົມສັກ ສີສຸວັນ',
      department: 'ຫ້ອງການສຳນັກງານໃຫຍ່',
      division: 'ພະແນກສັນຍາທົ່ວໄປ',
      email: 'somsak@edl.com.la',
      phone: '02055555555',
      role: 'MAIN_USER',
      roleId: 'role-999',
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
      isActive: true,
      modulePermissions: {
        CONTRACTS: { canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true },
        POWER_CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        LEGAL_AND_DISPUTE: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
      },
    };

    const payload = toCreatePayload(formValues);
    expect(payload.employeeCode).toBe('EDL-44652');
    expect(payload.role).toBe('MAIN_USER');
    expect(payload.division).toBe('ພະແນກສັນຍາທົ່ວໄປ');
    expect(payload.canView).toBe(true);
    expect(payload.canUpload).toBe(true);
    expect(payload.canEdit).toBe(true);
    expect(payload.canDelete).toBe(true);
    expect(payload.canDownload).toBe(true);
    expect((payload as unknown as Record<string, unknown>).roleId).toBeUndefined();
    expect((payload as unknown as Record<string, unknown>).department).toBeUndefined();
    expect((payload as unknown as Record<string, unknown>).fullName).toBeUndefined();

    // Only active modules included
    expect(payload.modulePermissions).toHaveLength(1);
    const contractsPerm = payload.modulePermissions?.find((m) => m.module === 'CONTRACTS');
    expect(contractsPerm?.canView).toBe(true);
    expect(contractsPerm?.canUpload).toBe(true);

    const disputePerm = payload.modulePermissions?.find((m) => m.module === 'LEGAL_AND_DISPUTE');
    expect(disputePerm).toBeUndefined();
  });

  it('matches exact payload structure required by backend for MAIN_USER with customized modules', () => {
    const formValues: UserFormValues = {
      employeeCode: 'EDL-001',
      fullName: 'ສົມສັກ ສີສຸວັນ',
      department: 'ຫ້ອງການສຳນັກງານໃຫຍ່',
      division: 'ພະແນກສັນຍາທົ່ວໄປ',
      email: 'somsak@edl.com.la',
      phone: '02055555555',
      role: 'MAIN_USER',
      roleId: 'role-1',
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
      isActive: true,
      modulePermissions: {
        CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        POWER_CONTRACTS: { canView: true, canUpload: false, canEdit: false, canDelete: false, canDownload: true },
        LEGAL_AND_DISPUTE: { canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true },
      },
    };

    const payload = toCreatePayload(formValues);
    expect(payload).toEqual({
      employeeCode: 'EDL-001',
      role: 'MAIN_USER',
      division: 'ພະແນກສັນຍາທົ່ວໄປ',
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
      modulePermissions: [
        {
          module: 'POWER_CONTRACTS',
          canView: true,
          canUpload: false,
          canEdit: false,
          canDelete: false,
          canDownload: true,
        },
        {
          module: 'LEGAL_DOCUMENTS',
          canView: true,
          canUpload: true,
          canEdit: true,
          canDelete: true,
          canDownload: true,
        },
        {
          module: 'LEGAL_CASES',
          canView: true,
          canUpload: true,
          canEdit: true,
          canDelete: true,
          canDownload: true,
        },
      ],
    });
  });

  it('correctly provides permissionSummary', () => {
    const adminUser: AdminUser = {
      id: '1',
      employeeCode: 'EDL-1',
      username: 'admin',
      fullName: 'Admin',
      email: null,
      phone: null,
      department: null,
      division: null,
      position: null,
      role: 'ADMIN',
      isActive: true,
      createdAt: null,
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
    };
    expect(permissionSummary(adminUser)).toContain('ທຸກສິດທິ');

    const pillarUser: AdminUser = {
      ...adminUser,
      role: 'CUSTOM_ROLE',
      permissionsByModule: {
        CONTRACTS: { canView: true, canUpload: true, canEdit: false, canDelete: false, canDownload: true },
        POWER_CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        LEGAL_AND_DISPUTE: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
      },
    };
    expect(permissionSummary(pillarUser)).toBe('ສັນຍາທົ່ວໄປ');
  });
});

