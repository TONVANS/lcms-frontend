import { describe, expect, it } from 'vitest';
import { toUser } from '@/features/auth/lib/user-mapper';
import { canAccessModule, hasPermission, isAdmin, isDepartmentHead } from './permissions';

describe('RBAC Permissions & 3 Core Pillars Matrix', () => {
  it('correctly grants full access to ADMIN users', () => {
    const adminUser = toUser({
      id: 'admin-1',
      username: 'admin',
      fullName: 'System Administrator',
      role: 'ADMIN',
    });

    expect(isAdmin(adminUser)).toBe(true);
    expect(canAccessModule(adminUser, 'gc')).toBe(true);
    expect(canAccessModule(adminUser, 'ppa')).toBe(true);
    expect(canAccessModule(adminUser, 'legal')).toBe(true);

    expect(hasPermission(adminUser, 'gc', 'view')).toBe(true);
    expect(hasPermission(adminUser, 'gc', 'create')).toBe(true);
    expect(hasPermission(adminUser, 'gc', 'edit')).toBe(true);
    expect(hasPermission(adminUser, 'gc', 'delete')).toBe(true);
    expect(hasPermission(adminUser, 'gc', 'download')).toBe(true);
  });

  it('correctly handles DEPARTMENT_HEAD read-only audit permissions', () => {
    const deptHead = toUser({
      id: 'head-1',
      username: 'head',
      fullName: 'Head of Legal',
      role: 'DEPARTMENT_HEAD',
      permissionsByModule: {
        CONTRACTS: { canView: true, canDownload: true, canUpload: false, canEdit: false, canDelete: false },
        POWER_CONTRACTS: { canView: true, canDownload: true, canUpload: false, canEdit: false, canDelete: false },
        LEGAL_AND_DISPUTE: { canView: true, canDownload: true, canUpload: false, canEdit: false, canDelete: false },
      },
    });

    expect(isDepartmentHead(deptHead)).toBe(true);
    expect(canAccessModule(deptHead, 'gc')).toBe(true);
    expect(canAccessModule(deptHead, 'ppa')).toBe(true);
    expect(canAccessModule(deptHead, 'legal')).toBe(true);

    // Can view and download
    expect(hasPermission(deptHead, 'gc', 'view')).toBe(true);
    expect(hasPermission(deptHead, 'gc', 'download')).toBe(true);

    // Cannot upload, edit, or delete
    expect(hasPermission(deptHead, 'gc', 'create')).toBe(false);
    expect(hasPermission(deptHead, 'gc', 'edit')).toBe(false);
    expect(hasPermission(deptHead, 'gc', 'delete')).toBe(false);
  });

  it('correctly isolates permissions based on permissionsByModule for dynamic custom roles', () => {
    const powerAuditor = toUser({
      id: 'user-2',
      username: 'auditor',
      fullName: 'Power Auditor',
      role: 'POWER_AUDITOR',
      roleTitle: 'ນາຍຊ່າງກວດສອບສັນຍາໄຟຟ້າ',
      permissionsByModule: {
        CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        POWER_CONTRACTS: { canView: true, canUpload: true, canEdit: true, canDelete: false, canDownload: true },
        LEGAL_AND_DISPUTE: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
      },
    });

    // PPA access granted
    expect(canAccessModule(powerAuditor, 'ppa')).toBe(true);
    expect(hasPermission(powerAuditor, 'ppa', 'view')).toBe(true);
    expect(hasPermission(powerAuditor, 'ppa', 'create')).toBe(true);
    expect(hasPermission(powerAuditor, 'ppa', 'edit')).toBe(true);
    expect(hasPermission(powerAuditor, 'ppa', 'download')).toBe(true);
    expect(hasPermission(powerAuditor, 'ppa', 'delete')).toBe(false);

    // General contracts and legal access denied
    expect(canAccessModule(powerAuditor, 'gc')).toBe(false);
    expect(canAccessModule(powerAuditor, 'legal')).toBe(false);
    expect(hasPermission(powerAuditor, 'gc', 'view')).toBe(false);
    expect(hasPermission(powerAuditor, 'legal', 'view')).toBe(false);
  });

  it('correctly propagates LEGAL_AND_DISPUTE permissions to sub-modules', () => {
    const legalSpecialist = toUser({
      id: 'user-3',
      username: 'lawyer',
      fullName: 'Legal Officer',
      role: 'LEGAL_OFFICER',
      permissionsByModule: {
        CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        POWER_CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        LEGAL_AND_DISPUTE: { canView: true, canUpload: true, canEdit: false, canDelete: false, canDownload: true },
      },
    });

    expect(canAccessModule(legalSpecialist, 'legal')).toBe(true);
    expect(hasPermission(legalSpecialist, 'legal', 'create')).toBe(true);
    expect(hasPermission(legalSpecialist, 'legal', 'edit')).toBe(false);
    expect(hasPermission(legalSpecialist, 'LEGAL_DOCUMENTS', 'create')).toBe(true);
    expect(hasPermission(legalSpecialist, 'LEGAL_CASES', 'create')).toBe(true);
  });

  it('correctly handles specific sub-module isolation between documents and cases', () => {
    const docOnlyUser = toUser({
      id: 'user-4',
      username: 'doc_user',
      fullName: 'Document Clerk',
      role: 'DOC_CLERK',
      permissionsByModule: {
        LEGAL_DOCUMENTS: { canView: true, canUpload: true, canEdit: true, canDelete: false, canDownload: true },
        LEGAL_CASES: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
      },
    });

    expect(canAccessModule(docOnlyUser, 'legal')).toBe(true);
    expect(canAccessModule(docOnlyUser, 'LEGAL_DOCUMENTS')).toBe(true);
    expect(canAccessModule(docOnlyUser, 'LEGAL_CASES')).toBe(false);

    expect(hasPermission(docOnlyUser, 'LEGAL_DOCUMENTS', 'view')).toBe(true);
    expect(hasPermission(docOnlyUser, 'LEGAL_DOCUMENTS', 'create')).toBe(true);
    expect(hasPermission(docOnlyUser, 'LEGAL_CASES', 'view')).toBe(false);
    expect(hasPermission(docOnlyUser, 'LEGAL_CASES', 'create')).toBe(false);
  });
});
