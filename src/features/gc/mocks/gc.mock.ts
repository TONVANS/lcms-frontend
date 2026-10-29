/**
 * Mock database in the backend's raw shape: Prisma Decimal values arrive as strings, dates as ISO
 * datetimes, and the detail/list rows carry a nested `contractType`. Dates are relative to today.
 */
import { MOCK_CONTRACT_TYPES } from '@/features/lookups/mocks/lookups.mock';

export interface RawContract {
  id: string;
  title: string;
  contractTypeId: number;
  contractType: { id: number; nameLo: string; nameEn: string | null };
  contractNumber: string;
  durationText: string | null;
  durationMonths: number | null;
  signedDate: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  contractValue: string | number | null;
  currency: 'LAK' | 'USD' | 'CNY' | null;
  equityOrCapitalContribution: string | null;
  sharePercentage: string | number | null;
  implementer: string | null;
  additionalDetails: string | null;
  notifyDaysBefore: number;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TERMINATED';
  createdAt: string;
  updatedAt: string;
}

type Status = RawContract['status'];
type Currency = NonNullable<RawContract['currency']>;

interface Seed {
  type: number;
  title: string;
  /** Days from today to the expiration date; null = open ended. */
  exp: number | null;
  months: number;
  status: Status;
  currency: Currency | null;
  value: string | number | null;
  share?: string | number;
  implementer?: string;
}

const SEEDS: Seed[] = [
  { type: 1, title: 'ສັນຍາບໍລິການ O&M ສະຖານີໄຟຟ້າຍ່ອຍ 115kV ນະຄອນຫຼວງ', exp: 5, months: 60, status: 'EXPIRING_SOON', currency: 'USD', value: '1500000.00' },
  { type: 2, title: 'ສັນຍາເຊົ່າອຸປະກອນພາກສະຖານີ ວຽງຈັນ 2', exp: 12, months: 36, status: 'EXPIRING_SOON', currency: 'LAK', value: '8500000000' },
  { type: 3, title: 'ສັນຍາເຊົ່າທີ່ດິນສ້າງສະຖານີ ບ້ານໜອງ', exp: 28, months: 120, status: 'EXPIRING_SOON', currency: 'LAK', value: 420000000 },
  { type: 4, title: 'ສັນຍາ EPC ສາຍສົ່ງ 230kV ເສັ້ນທາງເໜືອ', exp: 45, months: 48, status: 'EXPIRING_SOON', currency: 'USD', value: '12400000.50', implementer: 'ຝ່າຍວິສະວະກຳ' },
  { type: 5, title: 'ສັນຍາບໍລິການເກາະຫ້ອຍສາຍໂທລະຄົມ ເສົາໄຟຟ້າແຮງຕ່ຳ', exp: 60, months: 24, status: 'EXPIRING_SOON', currency: 'LAK', value: '960000000' },
  { type: 6, title: 'ສັນຍາຮັບຊຳລະຄ່າກະແສໄຟຟ້າ ຜ່ານທະນາຄານ BCEL', exp: 60, months: 36, status: 'EXPIRING_SOON', currency: null, value: null },
  { type: 7, title: 'ສັນຍາເຊົ່າສາຍ OPGW ເສັ້ນທາງໃຕ້', exp: 30, months: 60, status: 'EXPIRING_SOON', currency: 'USD', value: '2750000' },
  { type: 8, title: 'ສັນຍາເງິນຝາກກະແສລາຍວັນ ທະນາຄານ ການຄ້າຕ່າງປະເທດ', exp: 7, months: 12, status: 'EXPIRING_SOON', currency: 'CNY', value: '5000000.00' },
  { type: 9, title: 'ສັນຍາຊຳລະເງິນຜ່ານ EDL App ກັບທະນາຄານ ອຸດສາຫະກຳ', exp: 400, months: 36, status: 'ACTIVE', currency: null, value: null },
  { type: 10, title: 'ສັນຍາຮ່ວມທຸລະກິດ ໂຄງການໄຟຟ້າແສງຕາເວັນ', exp: 900, months: 120, status: 'ACTIVE', currency: 'USD', value: '35000000', share: '51.00' },
  { type: 11, title: 'ສັນຍາຮ່ວມຫຸ້ນ ບໍລິສັດໄຟຟ້ານໍ້າລາວ', exp: 1800, months: 240, status: 'ACTIVE', currency: 'USD', value: '90000000', share: 34.5 },
  { type: 12, title: 'ສັນຍາບໍລິການຜ່ານສາຍສົ່ງ (PTA) ໄທ-ລາວ', exp: 700, months: 60, status: 'ACTIVE', currency: 'USD', value: '4200000' },
  { type: 13, title: 'ບົດບັນທຶກຂໍ້ຕົກລົງ ການພັດທະນາສາຍສົ່ງຂ້າມແດນ', exp: 520, months: 36, status: 'ACTIVE', currency: null, value: null },
  { type: 14, title: 'ສັນຍາອື່ນໆ ທີ່ຖືກມອບໝາຍ ໂຄງການຊົນນະບົດ', exp: null, months: 0, status: 'ACTIVE', currency: 'LAK', value: '150000000' },
  { type: 1, title: 'ສັນຍາບໍລິການ O&M ໂຮງໄຟຟ້າເຊນໍ້ານ້ອຍ', exp: 300, months: 24, status: 'ACTIVE', currency: 'CNY', value: '9800000' },
  { type: 3, title: 'ສັນຍາເຊົ່າທີ່ດິນ ສະຖານີຈຳໜ່າຍ ປາກເຊ', exp: 1200, months: 360, status: 'ACTIVE', currency: 'LAK', value: '780000000' },
  { type: 4, title: 'ສັນຍາ EPC ສະຖານີໄຟຟ້າຍ່ອຍ ສະຫວັນນະເຂດ', exp: 250, months: 30, status: 'ACTIVE', currency: 'USD', value: '7300000' },
  { type: 2, title: 'ສັນຍາເຊົ່າອຸປະກອນສາຍສົ່ງ ຫຼວງພະບາງ', exp: 610, months: 48, status: 'ACTIVE', currency: 'LAK', value: '3400000000' },
  { type: 5, title: 'ສັນຍາບໍລິການເກາະຫ້ອຍ ເຄືອຂ່າຍ ເມືອງຈັນທະບູລີ', exp: 150, months: 24, status: 'ACTIVE', currency: 'LAK', value: 210000000 },
  { type: 7, title: 'ສັນຍາເຊົ່າສາຍ OPGW ເສັ້ນທາງກາງ', exp: -20, months: 60, status: 'EXPIRED', currency: 'USD', value: '1800000' },
  { type: 6, title: 'ສັນຍາຮັບຊຳລະຄ່າກະແສໄຟຟ້າ ຮ້ານຄ້າຕົວແທນ', exp: -90, months: 24, status: 'EXPIRED', currency: 'LAK', value: '120000000' },
  { type: 12, title: 'ສັນຍາ PTA ບໍລິການຜ່ານສາຍສົ່ງ ສະບັບເກົ່າ', exp: -200, months: 60, status: 'EXPIRED', currency: 'CNY', value: '640000' },
  { type: 13, title: 'ບົດບັນທຶກຂໍ້ຕົກລົງ ຄວາມຮ່ວມມືດ້ານເຕັກນິກ', exp: -400, months: 24, status: 'EXPIRED', currency: null, value: null },
  { type: 10, title: 'ສັນຍາຮ່ວມມື ໂຄງການໄຟຟ້າພະລັງງານລົມ (ຍົກເລີກ)', exp: 800, months: 120, status: 'TERMINATED', currency: 'USD', value: '22000000', share: '40' },
  { type: 8, title: 'ສັນຍາເງິນຝາກກະແສລາຍວັນ ສາຂາ ວຽງຈັນ (ຍົກເລີກ)', exp: 100, months: 12, status: 'TERMINATED', currency: 'LAK', value: '500000000' },
  { type: 9, title: 'ສັນຍາ EDL App ຮອບທົດລອງ (ຮ່າງ)', exp: null, months: 0, status: 'DRAFT', currency: null, value: null },
  { type: 11, title: 'ສັນຍາຮ່ວມຫຸ້ນ ໂຄງການໄຟຟ້າຊີວະມວນ (ຮ່າງ)', exp: 1500, months: 180, status: 'DRAFT', currency: 'USD', value: '15000000', share: 25 },
  { type: 14, title: 'ສັນຍາທີ່ຖືກມອບໝາຍ ການຕິດຕັ້ງມິເຕີອັດສະລິຍະ (ຮ່າງ)', exp: 365, months: 12, status: 'DRAFT', currency: 'LAK', value: '60000000' },
];

const pad = (n: number): string => String(n).padStart(3, '0');

function iso(offsetDays: number, now: Date): string {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString();
}

function typeOf(id: number): RawContract['contractType'] {
  const t = MOCK_CONTRACT_TYPES.find((x) => x.id === id) ?? MOCK_CONTRACT_TYPES[0];
  return { id: t.id, nameLo: t.nameLo, nameEn: t.nameEn };
}

export function createContractSeed(now: Date = new Date()): RawContract[] {
  return SEEDS.map((s, i) => {
    const n = i + 1;
    const span = Math.max(s.months, 12) * 30;
    return {
      id: `gc-${pad(n)}`,
      title: s.title,
      contractTypeId: s.type,
      contractType: typeOf(s.type),
      contractNumber: `GC-2026-${pad(n)}`,
      durationText: s.months > 0 ? (s.months % 12 === 0 ? `${s.months / 12} ປີ` : `${s.months} ເດືອນ`) : null,
      durationMonths: s.months > 0 ? s.months : null,
      signedDate: iso((s.exp ?? 365) - span - 14, now),
      effectiveDate: iso((s.exp ?? 365) - span, now),
      expirationDate: s.exp === null ? null : iso(s.exp, now),
      contractValue: s.value,
      currency: s.currency,
      equityOrCapitalContribution: s.share !== undefined ? `${s.share}%` : null,
      sharePercentage: s.share ?? null,
      implementer: s.implementer ?? 'ຝ່າຍກົດໝາຍ-ສັນຍາ',
      additionalDetails: n % 3 === 0 ? 'ໝາຍເຫດ: ຕິດຕາມການຕໍ່ສັນຍາ' : null,
      notifyDaysBefore: 60,
      status: s.status,
      createdAt: iso(-(120 - n), now),
      updatedAt: iso(-(30 - Math.min(n, 29)), now),
    };
  });
}

let rows: RawContract[] = createContractSeed();
let seq = rows.length;

export const gcMockDb = {
  all: (): RawContract[] => rows,
  get: (id: string): RawContract | undefined => rows.find((r) => r.id === id),
  insert(body: Partial<RawContract>): RawContract {
    seq += 1;
    const now = new Date().toISOString();
    const row: RawContract = {
      id: `gc-${pad(seq)}`,
      title: '',
      contractTypeId: 0,
      contractType: typeOf(Number(body.contractTypeId ?? 0)),
      contractNumber: '',
      durationText: null,
      durationMonths: null,
      signedDate: null,
      effectiveDate: null,
      expirationDate: null,
      contractValue: null,
      currency: null,
      equityOrCapitalContribution: null,
      sharePercentage: null,
      implementer: null,
      additionalDetails: null,
      notifyDaysBefore: 60,
      status: 'ACTIVE',
      ...body,
      createdAt: now,
      updatedAt: now,
    } as RawContract;
    row.contractType = typeOf(Number(row.contractTypeId));
    rows = [row, ...rows];
    return row;
  },
  update(id: string, patch: Partial<RawContract>): RawContract | undefined {
    const cur = rows.find((r) => r.id === id);
    if (!cur) return undefined;
    const next = { ...cur, ...patch, id, updatedAt: new Date().toISOString() } as RawContract;
    next.contractType = typeOf(Number(next.contractTypeId));
    rows = rows.map((r) => (r.id === id ? next : r));
    return next;
  },
  remove(id: string): boolean {
    const had = rows.some((r) => r.id === id);
    rows = rows.filter((r) => r.id !== id);
    return had;
  },
  reset(now: Date = new Date()): void {
    rows = createContractSeed(now);
    seq = rows.length;
  },
};
