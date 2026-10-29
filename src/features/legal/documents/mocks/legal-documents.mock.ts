import { addDays, subDays } from 'date-fns';
import { MOCK_DEPARTMENTS } from '@/features/lookups/mocks/lookups.mock';
import { createMockDb, type MockDb, type MockRow } from '../../lib/mock-db';
import { DOC_TYPES } from '../types';

// Mock Lao text is data, not UI copy. Names are fictional.

/** Backend-shaped row (Prisma): `issueYear` may arrive as a string, dates as ISO datetimes. */
export interface RawLegalDocument extends MockRow {
  id: string;
  docTitle: string;
  docType: string;
  issueYear: number | string;
  docNumberDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  responsiblePerson: string | null;
  departmentId: string;
  department: { id: string; name: string };
  purpose: string | null;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const TYPE_TITLE: Record<(typeof DOC_TYPES)[number], string> = {
  REGULATION: 'ລະບຽບວ່າດ້ວຍ',
  PROVISION: 'ຂໍ້ກຳນົດກ່ຽວກັບ',
  AGREEMENT: 'ຂໍ້ຕົກລົງວ່າດ້ວຍ',
  NOTIFICATION: 'ແຈ້ງການກ່ຽວກັບ',
  INSTRUCTION: 'ຄໍາແນະນໍາກ່ຽວກັບ',
  PROPOSAL: 'ໜັງສືສະເໜີກ່ຽວກັບ',
  CONTRACT: 'ສັນຍາວ່າດ້ວຍ',
  MANUAL: 'ປຶ້ມຄູ່ມືກ່ຽວກັບ',
  OTHER: 'ເອກະສານກ່ຽວກັບ',
};

const TOPICS = [
  'ການຄຸ້ມຄອງບຸກຄະລາກອນ',
  'ການເງິນ ແລະ ບັນຊີ',
  'ຄວາມປອດໄພໃນການເຮັດວຽກ',
  'ການຈັດຊື້-ຈັດຈ້າງ',
  'ການບໍລິການລູກຄ້າ',
  'ເຕັກໂນໂລຊີຂໍ້ມູນຂ່າວສານ',
  'ການກວດກາພາຍໃນ',
  'ການຄຸ້ມຄອງໂຄງການ',
  'ການບຳລຸງຮັກສາລະບົບໄຟຟ້າ',
];

const PEOPLE = ['ທ່ານ ສົມສັກ ວົງສາ', 'ທ່ານ ນາງ ວັນນາ ສີສຸກ', 'ທ່ານ ບຸນຊູ ພົມມະຈັນ', null];

export const MOCK_LEGAL_DOCUMENT_COUNT = 27;

export function createLegalDocumentSeed(now: Date): RawLegalDocument[] {
  return Array.from({ length: MOCK_LEGAL_DOCUMENT_COUNT }, (_, i) => {
    const n = i + 1;
    const docType = DOC_TYPES[i % DOC_TYPES.length];
    const dept = MOCK_DEPARTMENTS[i % MOCK_DEPARTMENTS.length];
    const created = subDays(now, 12 * n);
    const year = 2018 + (i % 9);
    return {
      id: `reg-${n}`,
      docTitle:
        n === 1 ? 'ລະບຽບວ່າດ້ວຍຕົວຊີ້ວັດການປະເມີນຜົນ (KPI) ພະນັກງານ' : `${TYPE_TITLE[docType]}${TOPICS[i % TOPICS.length]}`,
      docType,
      issueYear: i % 5 === 0 ? String(year) : year,
      docNumberDate: `ເລກທີ ${300 + n}/ຟຟລ, ລົງວັນທີ 15/${String((i % 12) + 1).padStart(2, '0')}/${year}`,
      status: i % 4 === 3 ? 'INACTIVE' : 'ACTIVE',
      responsiblePerson: PEOPLE[i % PEOPLE.length],
      departmentId: dept.id,
      department: { id: dept.id, name: dept.name },
      purpose: i % 3 === 0 ? null : 'ເພື່ອກຳນົດຫຼັກການ ແລະ ລະບຽບການປະຕິບັດງານພາຍໃນ ຟຟລ',
      externalUrl: i % 2 === 0 ? `https://sharepoint.edl.example/docs/${n}` : null,
      createdAt: created.toISOString(),
      updatedAt: addDays(created, 1).toISOString(),
    };
  });
}

export const legalDocumentsMockDb: MockDb<RawLegalDocument> = createMockDb(
  createLegalDocumentSeed,
  (r) => r.id,
);

let seq = 1000;
export function nextLegalDocumentId(): string {
  seq += 1;
  return `reg-${seq}`;
}
