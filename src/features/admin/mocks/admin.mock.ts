import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { MOCK_CONTRACT_TYPES, MOCK_DEPARTMENTS } from '@/features/lookups/mocks/lookups.mock';

export interface MockAuditLog {
  id: string;
  action: string;
  createdAt: string;
  userId: string;
  user: { id: string; fullName: string; username: string };
  entityType: string;
  entityId: string;
  contract: { contractNumber: string } | null;
  ipAddress: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

export interface MockContractTypeRow {
  id: number;
  nameLo: string;
  nameEn: string | null;
  isActive: boolean;
}

export interface MockDepartmentRow {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
}

/** Ids that "contracts/documents reference": the mock server refuses to delete them (400). */
export const IN_USE_CONTRACT_TYPE_IDS: ReadonlySet<number> = new Set([1, 2, 3]);
export const IN_USE_DEPARTMENT_IDS: ReadonlySet<string> = new Set([
  MOCK_DEPARTMENTS[0].id,
  MOCK_DEPARTMENTS[1].id,
]);

const ACTIONS = [
  'CREATE_CONTRACT',
  'UPDATE_CONTRACT',
  'DELETE_CONTRACT',
  'UPLOAD_ATTACHMENT',
  'DOWNLOAD_ATTACHMENT',
  'DELETE_ATTACHMENT',
  'USER_PERMISSION_CHANGE',
  'CREATE_LEGAL_DOCUMENT',
  'UPDATE_LEGAL_DOCUMENT',
  'DELETE_LEGAL_DOCUMENT',
  'CREATE_LEGAL_CASE',
  'UPDATE_LEGAL_CASE',
  'DELETE_LEGAL_CASE',
  'CREATE_POWER_CONTRACT',
  'UPDATE_POWER_CONTRACT',
  'DELETE_POWER_CONTRACT',
  'UPLOAD_POWER_ATTACHMENT',
  'DOWNLOAD_POWER_ATTACHMENT',
  'DELETE_POWER_ATTACHMENT',
] as const;

function values(i: number, action: string): Pick<MockAuditLog, 'oldValues' | 'newValues'> {
  if (action.startsWith('UPDATE')) {
    return {
      oldValues: { title: `Title ${i}`, status: 'DRAFT', amount: i * 1000 },
      newValues: { title: `Title ${i} (rev)`, status: 'ACTIVE', amount: i * 1000 },
    };
  }
  if (action.startsWith('CREATE')) return { oldValues: null, newValues: { title: `Title ${i}`, status: 'DRAFT' } };
  if (action.startsWith('DELETE')) return { oldValues: { title: `Title ${i}`, status: 'ACTIVE' }, newValues: null };
  if (action === 'USER_PERMISSION_CHANGE') {
    return { oldValues: { canEdit: false, canDelete: false }, newValues: { canEdit: true, canDelete: false } };
  }
  return { oldValues: null, newValues: { fileName: `file-${i}.pdf` } };
}

function buildAuditLogs(now: Date): MockAuditLog[] {
  return Array.from({ length: 30 }, (_, n) => {
    const i = n + 1;
    const action = ACTIONS[n % ACTIONS.length];
    const u = MOCK_USERS[n % MOCK_USERS.length];
    return {
      id: `al-${String(i).padStart(3, '0')}`,
      action,
      createdAt: new Date(now.getTime() - i * 3_600_000 * 5).toISOString(),
      userId: u.id,
      user: { id: u.id, fullName: u.fullName, username: u.username },
      entityType: action.includes('LEGAL_CASE')
        ? 'LegalCase'
        : action.includes('LEGAL')
          ? 'LegalDocument'
          : action.includes('POWER')
            ? 'PowerContract'
            : action === 'USER_PERMISSION_CHANGE'
              ? 'User'
              : 'Contract',
      entityId: `e-${100 + i}`,
      contract: { contractNumber: `GC-2026-${String(i).padStart(3, '0')}` },
      ipAddress: `10.0.${i % 4}.${10 + i}`,
      ...values(i, action),
    };
  });
}

export const adminMockDb = (() => {
  let auditLogs: MockAuditLog[] = [];
  let contractTypes: MockContractTypeRow[] = [];
  let departments: MockDepartmentRow[] = [];
  let nextTypeId = 100;
  let nextDeptId = 1;

  const db = {
    reset(now: Date = new Date()): void {
      auditLogs = buildAuditLogs(now);
      contractTypes = MOCK_CONTRACT_TYPES.map((t) => ({ ...t, isActive: true }));
      departments = MOCK_DEPARTMENTS.map((d) => ({ ...d, isActive: true }));
      nextTypeId = 100;
      nextDeptId = 1;
    },
    auditLogs: () => auditLogs,
    contractTypes: () => contractTypes,
    departments: () => departments,
    setContractTypes(next: MockContractTypeRow[]): void {
      contractTypes = next;
    },
    setDepartments(next: MockDepartmentRow[]): void {
      departments = next;
    },
    newTypeId: () => nextTypeId++,
    newDeptId: () => `3f6c1a10-9${String(nextDeptId++).padStart(3, '0')}-4b8e-9a01-5d2e7c0a2000`,
  };
  db.reset();
  return db;
})();
