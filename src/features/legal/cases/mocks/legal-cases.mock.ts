import { format, subDays } from 'date-fns';
import { MOCK_DEPARTMENTS } from '@/features/lookups/mocks/lookups.mock';
import { createMockDb, type MockDb, type MockRow } from '@/lib/api/mock/mock-db';
import { CASE_TYPES, DISPUTE_STATUSES } from '../types';

// Mock Lao text is data, not UI copy. Names are fictional.

/** Backend-shaped row (Prisma): Decimal fields arrive as strings, `date` as an ISO datetime. */
export interface RawLegalCase extends MockRow {
  id: number;
  internalId: string;
  caseCode: string;
  defendant: string;
  allegation: string | null;
  departmentId: string;
  department: { id: string; name: string };
  departmentAction: string | null;
  caseType: string;
  damageLak: number | string;
  damageUsd: number | string;
  fineLak: number | string;
  fineUsd: number | string;
  totalDueLak: number | string;
  totalDueUsd: number | string;
  disputeStatus: string;
  recoveredLak: number | string;
  recoveredUsd: number | string;
  date: string;
  disputeProgress: string | null;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const DEFENDANTS = [
  'ບໍລິສັດ ບົວລະພາ ກໍ່ສ້າງ ຈຳກັດ',
  'ບໍລິສັດ ແສງດາວ ພັດທະນາ ຈຳກັດ',
  'ຫ້າງຮ້ານ ວັນເພັງ ຂາຍສົ່ງ',
  'ບໍລິສັດ ລາວໄຊ ວິສະວະກຳ ຈຳກັດຜູ້ດຽວ',
  'ທ້າວ ຄຳແກ້ວ ມະນີວົງ',
  'ບໍລິສັດ ພູດິນແດງ ໂລຈິດສະຕິກ',
];

const ALLEGATIONS = [
  'ລະເມີດສັນຍາຮັບເໝົາກໍ່ສ້າງ ແລະ ບໍ່ມອບວຽກຕາມກຳນົດ',
  'ຄ້າງຊຳລະຄ່າໄຟຟ້າ',
  'ທຳລາຍຊັບສິນລັດ (ສາຍສົ່ງໄຟຟ້າ)',
  'ລະເມີດເງື່ອນໄຂການເຊົ່າທີ່ດິນ',
  null,
];

const PROGRESS = [
  'ສານຂັ້ນຕົ້ນກຳລັງໄຕ່ສວນພະຍານ',
  'ຢູ່ໃນຂັ້ນຕອນການອຸທອນ',
  'ລໍຖ້າຄຳຕັດສິນຂອງສານສູງສຸດ',
  null,
];

export const MOCK_LEGAL_CASE_COUNT = 27;

export function createLegalCaseSeed(now: Date): RawLegalCase[] {
  return Array.from({ length: MOCK_LEGAL_CASE_COUNT }, (_, i) => {
    const n = i + 1;
    const dept = MOCK_DEPARTMENTS[(i + 2) % MOCK_DEPARTMENTS.length];
    const damageLak = (i % 6 === 5 ? 0 : 20_000_000 * n) + (i % 4 === 0 ? 0.5 : 0);
    const fineLak = i % 3 === 0 ? 0 : 2_000_000 * n;
    const damageUsd = i % 2 === 0 ? 1_000 * n : 0;
    const fineUsd = i % 2 === 0 ? 100 * n : 0;
    const closed = DISPUTE_STATUSES[i % DISPUTE_STATUSES.length] === 'RESOLVED';
    const str = (x: number): number | string => (i % 3 === 1 ? x.toFixed(2) : x);
    return {
      id: n,
      internalId: `case-${n}`,
      caseCode: `EDL-2026-${String(n).padStart(3, '0')}`,
      defendant: DEFENDANTS[i % DEFENDANTS.length],
      allegation: ALLEGATIONS[i % ALLEGATIONS.length],
      departmentId: dept.id,
      department: { id: dept.id, name: dept.name },
      departmentAction: i % 2 === 0 ? 'ສົ່ງເອກະສານໃຫ້ພະແນກນິຕິກຳດຳເນີນຄະດີ' : null,
      caseType: CASE_TYPES[(i + Math.floor(i / 5)) % CASE_TYPES.length],
      damageLak: str(damageLak),
      damageUsd: str(damageUsd),
      fineLak: str(fineLak),
      fineUsd: str(fineUsd),
      totalDueLak: str(damageLak + fineLak),
      totalDueUsd: str(damageUsd + fineUsd),
      disputeStatus: DISPUTE_STATUSES[i % DISPUTE_STATUSES.length],
      recoveredLak: str(closed ? damageLak : Math.floor(damageLak / 5)),
      recoveredUsd: str(closed ? damageUsd : Math.floor(damageUsd / 5)),
      date: `${format(subDays(now, 9 * n), 'yyyy-MM-dd')}T00:00:00.000Z`,
      disputeProgress: PROGRESS[i % PROGRESS.length],
      externalUrl: i % 3 === 0 ? `https://sharepoint.edl.example/cases/${n}` : null,
      createdAt: subDays(now, 9 * n).toISOString(),
      updatedAt: subDays(now, 9 * n - 1).toISOString(),
    };
  });
}

export const legalCasesMockDb: MockDb<RawLegalCase> = createMockDb(
  createLegalCaseSeed,
  (r) => r.internalId,
);

let seq = 1000;
export function nextLegalCaseIds(): { id: number; internalId: string } {
  seq += 1;
  return { id: seq, internalId: `case-${seq}` };
}
