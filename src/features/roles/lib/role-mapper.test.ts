import { describe, expect, it } from 'vitest';
import type { CoreModuleKey, PermissionActionKey } from '@/types/domain';
import { toRoleCreatePayload, toRolePermissionsPayload, toRoleUpdatePayload } from './role-mapper';

describe('Role Mapper', () => {
  it('maps 3-pillar UI permissions to valid backend module permissions (excluding invalid LEGAL_AND_DISPUTE)', () => {
    const uiPermissions: Record<CoreModuleKey, Record<PermissionActionKey, boolean>> = {
      CONTRACTS: {
        canView: true,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: true,
      },
      POWER_CONTRACTS: {
        canView: true,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: true,
      },
      LEGAL_AND_DISPUTE: {
        canView: false,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: false,
      },
    };

    const perms = toRolePermissionsPayload(uiPermissions);
    expect(perms).toHaveLength(2);
    expect(perms.find((p) => p.module === 'LEGAL_AND_DISPUTE')).toBeUndefined();
    expect(perms).toEqual([
      {
        module: 'CONTRACTS',
        canView: true,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: true,
      },
      {
        module: 'POWER_CONTRACTS',
        canView: true,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: true,
      },
    ]);
  });

  it('correctly splits active LEGAL_AND_DISPUTE permissions into LEGAL_DOCUMENTS and LEGAL_CASES', () => {
    const uiPermissions: Record<CoreModuleKey, Record<PermissionActionKey, boolean>> = {
      CONTRACTS: {
        canView: false,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: false,
      },
      POWER_CONTRACTS: {
        canView: false,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: false,
      },
      LEGAL_AND_DISPUTE: {
        canView: true,
        canUpload: true,
        canEdit: false,
        canDelete: false,
        canDownload: true,
      },
    };

    const perms = toRolePermissionsPayload(uiPermissions);
    expect(perms).toHaveLength(2);
    expect(perms.find((p) => p.module === 'LEGAL_AND_DISPUTE')).toBeUndefined();

    const docPerm = perms.find((p) => p.module === 'LEGAL_DOCUMENTS');
    expect(docPerm?.canView).toBe(true);
    expect(docPerm?.canUpload).toBe(true);

    const casePerm = perms.find((p) => p.module === 'LEGAL_CASES');
    expect(casePerm?.canView).toBe(true);
    expect(casePerm?.canUpload).toBe(true);
  });

  it('matches exact payload structure required by backend for CONTRACT_AUDITOR', () => {
    const uiPermissions: Record<CoreModuleKey, Record<PermissionActionKey, boolean>> = {
      CONTRACTS: {
        canView: true,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: true,
      },
      POWER_CONTRACTS: {
        canView: true,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: true,
      },
      LEGAL_AND_DISPUTE: {
        canView: false,
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canDownload: false,
      },
    };

    const payload = toRoleCreatePayload(
      'CONTRACT_AUDITOR',
      'ຜູ້ກວດສອບສັນຍາ',
      'ກວດສອບ ແລະ ດາວໂຫຼດເອກະສານສັນຍາທຸກພະແນກ',
      uiPermissions,
    );

    expect(payload).toEqual({
      name: 'CONTRACT_AUDITOR',
      title: 'ຜູ້ກວດສອບສັນຍາ',
      description: 'ກວດສອບ ແລະ ດາວໂຫຼດເອກະສານສັນຍາທຸກພະແນກ',
      permissions: [
        {
          module: 'CONTRACTS',
          canView: true,
          canUpload: false,
          canEdit: false,
          canDelete: false,
          canDownload: true,
        },
        {
          module: 'POWER_CONTRACTS',
          canView: true,
          canUpload: false,
          canEdit: false,
          canDelete: false,
          canDownload: true,
        },
      ],
    });
  });
});

