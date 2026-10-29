import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { DIVISIONS } from '../types';

/** Raw backend-shaped user rows kept by the mock server. */
export type MockUserRow = Record<string, unknown> & {
  id: string;
  employeeCode: string;
  username: string;
  fullName: string;
  email: string | null;
  role: string;
  isActive: boolean;
};

export interface MockHrmProfile {
  employeeCode: string;
  fullName: string;
  department: string;
  division: string;
  position: string;
  email: string;
  phone: string;
}

export const MOCK_HRM: MockHrmProfile[] = [
  {
    employeeCode: 'EDL-001',
    fullName: 'ທ້າວ ສົມສັກ ສີສຸວັນ',
    department: 'ຫ້ອງການສຳນັກງານໃຫຍ່',
    division: DIVISIONS[0],
    position: 'ນັກວິຊາການ',
    email: 'somsak@edl.com.la',
    phone: '02055555555',
  },
  {
    employeeCode: 'EDL-002',
    fullName: 'ນາງ ມະນີວອນ ແສງຈັນ',
    department: 'ຫ້ອງການສຳນັກງານໃຫຍ່',
    division: DIVISIONS[1],
    position: 'ນິຕິກອນ',
    email: 'manivone@edl.com.la',
    phone: '02055550002',
  },
  {
    employeeCode: 'EDL-003',
    fullName: 'ທ້າວ ຄຳຜຸຍ ພົມມະຈັນ',
    department: 'ຝ່າຍຊື້-ຂາຍໄຟຟ້າ',
    division: DIVISIONS[2],
    position: 'ຫົວໜ້າພະແນກ',
    email: 'khamphoui@edl.com.la',
    phone: '02055550003',
  },
];

const FLAGS_NONE = { canView: true, canUpload: false, canEdit: false, canDelete: false, canDownload: false };

function seed(): MockUserRow[] {
  const base = MOCK_USERS.map((u, i) => ({
    ...u,
    isActive: true,
    createdAt: new Date(Date.UTC(2026, 0, 5 + i)).toISOString(),
  })) as unknown as MockUserRow[];
  const extra: MockUserRow[] = Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    return {
      id: `u-x${n}`,
      employeeCode: `EMP${2000 + n}`,
      username: `emp${2000 + n}`,
      fullName: `ຜູ້ໃຊ້ທົດລອງ ${n}`,
      email: `user${n}@lcms.la`,
      phone: `020 5${String(900000 + n)}`,
      department: 'ຫ້ອງການ ຝ່າຍກົດໝາຍ ແລະ ສັນຍາ',
      division: DIVISIONS[i % 3],
      position: null,
      role: i % 3 === 0 ? 'EDITOR' : 'VIEWER',
      ...FLAGS_NONE,
      canUpload: i % 3 === 0,
      canEdit: i % 3 === 0,
      accessibleModules: ['departments', 'support'],
      isActive: i % 4 !== 3,
      createdAt: new Date(Date.UTC(2026, 2, 1 + i)).toISOString(),
    };
  });
  return [...base, ...extra];
}

let rows: MockUserRow[] = seed();
let counter = 0;

export const usersMockDb = {
  all: (): MockUserRow[] => rows,
  find: (id: string): MockUserRow | undefined => rows.find((r) => r.id === id),
  findByCode: (code: string): MockUserRow | undefined =>
    rows.find((r) => r.employeeCode.toLowerCase() === code.toLowerCase()),
  hrm: (code: string): MockHrmProfile | undefined =>
    MOCK_HRM.find((h) => h.employeeCode.toLowerCase() === code.toLowerCase()),
  insert(row: Omit<MockUserRow, 'id' | 'createdAt'>): MockUserRow {
    counter += 1;
    const created = { ...row, id: `u-new-${counter}`, createdAt: new Date().toISOString() } as unknown as MockUserRow;
    rows = [created, ...rows];
    return created;
  },
  remove(id: string): boolean {
    const before = rows.length;
    rows = rows.filter((r) => r.id !== id);
    return rows.length < before;
  },
  reset(): void {
    rows = seed();
    counter = 0;
  },
};
