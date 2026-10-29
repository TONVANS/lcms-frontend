import { MOCK_PROJECT_TYPES } from '@/features/lookups/mocks/lookups.mock';

/** Raw, backend-shaped power contract (numbers may be strings, dates may be ISO datetimes). */
export type RawPowerContract = Record<string, unknown>;

const [HYDRO, SOLAR, WIND, COAL, BIOMASS] = MOCK_PROJECT_TYPES;

function isoDate(base: Date, offsetDays: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

type Status = 'DRAFT' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TERMINATED';
type Row = [
  type: 'PURCHASE' | 'SALE',
  number: string,
  name: string,
  projectTypeOrCustomer: string,
  capacity: number,
  unit: 'MW' | 'kW',
  tariff: number,
  currency: 'LAK' | 'USD' | 'CNY',
  status: Status,
  expiresInDays: number,
  termMonths: number,
  location: string,
];

const ROWS: Row[] = [
  ['PURCHASE', 'PPA-EDL-2010-001', 'ເຂື່ອນໄຟຟ້າ ນ້ຳເທີນ 2 (Nam Theun 2)', HYDRO, 1088, 'MW', 0.0585, 'USD', 'EXPIRING_SOON', 6, 300, 'ແຂວງຄຳມ່ວນ'],
  ['PURCHASE', 'PPA-EDL-1971-002', 'ເຂື່ອນໄຟຟ້າ ນ້ຳງື່ມ 1 (Nam Ngum 1)', HYDRO, 155, 'MW', 0.045, 'USD', 'EXPIRING_SOON', 20, 720, 'ແຂວງວຽງຈັນ'],
  ['PURCHASE', 'PPA-EDL-2015-014', 'ໂຄງການໄຟຟ້າຄວາມຮ້ອນ ຫົງສາ (Hongsa)', COAL, 1878, 'MW', 0.062, 'USD', 'EXPIRING_SOON', 40, 300, 'ແຂວງໄຊຍະບູລີ'],
  ['PURCHASE', 'PPA-EDL-2023-088', 'ໂຄງການພະລັງງານລົມ ມອນຊູນ (Monsoon Wind)', WIND, 600, 'MW', 0.0695, 'USD', 'EXPIRING_SOON', 60, 300, 'ແຂວງເຊກອງ'],
  ['PURCHASE', 'PPA-EDL-2024-102', 'ໂຄງການໄຟຟ້າແສງຕາເວັນ ໄຊທານີ', SOLAR, 50, 'MW', 0.062, 'USD', 'ACTIVE', 7000, 300, 'ນະຄອນຫຼວງວຽງຈັນ'],
  ['PURCHASE', 'PPA-EDL-2022-071', 'ເຂື່ອນໄຟຟ້າ ນ້ຳອູ 6', HYDRO, 180, 'MW', 0.058, 'USD', 'ACTIVE', 8000, 360, 'ແຂວງຜົ້ງສາລີ'],
  ['PURCHASE', 'PPA-EDL-2021-033', 'ໂຮງໄຟຟ້າຊີວະມວນ ສະຫວັນນະເຂດ', BIOMASS, 12, 'MW', 0.075, 'USD', 'ACTIVE', 5000, 240, 'ແຂວງສະຫວັນນະເຂດ'],
  ['PURCHASE', 'PPA-EDL-2025-004', 'ໂຄງການພະລັງງານລົມ ພູພຽງ', WIND, 100, 'MW', 0.065, 'USD', 'DRAFT', 9000, 300, 'ແຂວງຈຳປາສັກ'],
  ['PURCHASE', 'PPA-EDL-2020-019', 'ເຂື່ອນໄຟຟ້ານ້ອຍ ນ້ຳເງິບ', HYDRO, 800, 'kW', 0.045, 'USD', 'ACTIVE', 3000, 240, 'ແຂວງຫຼວງພະບາງ'],
  ['PURCHASE', 'PPA-EDL-2023-045', 'ໂຄງການແສງຕາເວັນຫຼັງຄາ ສະໜາມກິລາ', SOLAR, 450, 'kW', 850, 'LAK', 'ACTIVE', 2500, 180, 'ນະຄອນຫຼວງວຽງຈັນ'],
  ['PURCHASE', 'PPA-EDL-2008-006', 'ໂຮງໄຟຟ້າຖ່ານຫີນ ເຊກອງ', COAL, 300, 'MW', 0.055, 'USD', 'EXPIRED', -30, 180, 'ແຂວງເຊກອງ'],
  ['PURCHASE', 'PPA-EDL-2000-003', 'ເຂື່ອນໄຟຟ້າ ນ້ຳມັງ 3', HYDRO, 40, 'MW', 0.04, 'USD', 'EXPIRED', -200, 300, 'ແຂວງວຽງຈັນ'],
  ['PURCHASE', 'PPA-EDL-2019-027', 'ໂຄງການແສງຕາເວັນ ຫາດຊາຍຟອງ', SOLAR, 20, 'MW', 0.07, 'USD', 'TERMINATED', 1500, 240, 'ແຂວງບໍລິຄຳໄຊ'],
  ['PURCHASE', 'PPA-EDL-2025-009', 'ໂຮງໄຟຟ້າຊີວະມວນ ແກ່ນອ້ອຍ', BIOMASS, 5, 'MW', 0.08, 'USD', 'DRAFT', 6000, 180, 'ແຂວງຄຳມ່ວນ'],
  ['PURCHASE', 'PPA-EDL-2005-011', 'ເຂື່ອນໄຟຟ້າ ເຊເສັດ', HYDRO, 250, 'MW', 0.05, 'USD', 'EXPIRING_SOON', 15, 360, 'ແຂວງສາລະວັນ'],
  ['PURCHASE', 'PPA-EDL-2018-022', 'ໂຄງການແສງຕາເວັນ ປາກເຊ', SOLAR, 30, 'MW', 0.068, 'USD', 'EXPIRING_SOON', 33, 240, 'ແຂວງຈຳປາສັກ'],
  ['PURCHASE', 'PPA-EDL-2024-060', 'ໂຄງການພະລັງງານລົມ ບໍລິເວນ', WIND, 70, 'MW', 0.066, 'USD', 'ACTIVE', 7500, 300, 'ແຂວງຈຳປາສັກ'],
  ['PURCHASE', 'PPA-EDL-2017-030', 'ເຂື່ອນໄຟຟ້າ ນ້ຳເທີນ 1', HYDRO, 523, 'MW', 0.052, 'USD', 'ACTIVE', 6500, 360, 'ແຂວງຄຳມ່ວນ'],
  ['SALE', 'PSA-EDL-2020-001', 'ສັນຍາຂາຍໄຟ ໄທ', 'ການໄຟຟ້າຝ່າຍຜະລິດແຫ່ງປະເທດໄທ (EGAT)', 500, 'MW', 0.06, 'USD', 'ACTIVE', 4000, 240, 'ຊາຍແດນ ໜອງຄາຍ'],
  ['SALE', 'PSA-EDL-2021-002', 'ສັນຍາຂາຍໄຟ ກຳປູເຈຍ', 'ບໍລິສັດ ໄຟຟ້າກຳປູເຈຍ (EDC)', 200, 'MW', 0.07, 'USD', 'ACTIVE', 5200, 240, 'ຊາຍແດນ ແຂວງຈຳປາສັກ'],
  ['SALE', 'PSA-EDL-2016-003', 'ສັນຍາຂາຍໄຟ ຫວຽດນາມ', 'ການໄຟຟ້າຫວຽດນາມ (EVN)', 300, 'MW', 0.065, 'USD', 'EXPIRING_SOON', 25, 120, 'ຊາຍແດນ ແຂວງຄຳມ່ວນ'],
  ['SALE', 'PSA-EDL-2022-004', 'ສັນຍາຂາຍໄຟ ໂຮງງານຊີມັງ', 'ໂຮງງານຊີມັງ ວັງວຽງ', 2500, 'kW', 900, 'LAK', 'ACTIVE', 2200, 60, 'ແຂວງວຽງຈັນ'],
  ['SALE', 'PSA-EDL-2023-005', 'ສັນຍາຂາຍໄຟ ເຂດເສດຖະກິດພິເສດ', 'ເຂດເສດຖະກິດພິເສດ ບໍ່ເຕັນ', 80, 'MW', 0.4, 'CNY', 'ACTIVE', 3300, 120, 'ແຂວງຫຼວງນ້ຳທາ'],
  ['SALE', 'PSA-EDL-2019-006', 'ສັນຍາຂາຍໄຟ ບໍ່ແຮ່', 'ບໍລິສັດ ຂຸດຄົ້ນບໍ່ແຮ່ ABC', 1500, 'kW', 1100, 'LAK', 'EXPIRED', -10, 60, 'ແຂວງຄຳມ່ວນ'],
  ['SALE', 'PSA-EDL-2025-007', 'ສັນຍາຂາຍໄຟ ໂຮງແຮມ', 'ໂຮງແຮມ ລາວພລາຊາ', 900, 'kW', 1000, 'LAK', 'DRAFT', 1200, 36, 'ນະຄອນຫຼວງວຽງຈັນ'],
  ['SALE', 'PSA-EDL-2018-008', 'ສັນຍາຂາຍໄຟ ນິຄົມອຸດສາຫະກຳ', 'ນິຄົມອຸດສາຫະກຳ ວຽງຈັນ', 25, 'MW', 0.08, 'USD', 'TERMINATED', 900, 120, 'ນະຄອນຫຼວງວຽງຈັນ'],
  ['SALE', 'PSA-EDL-2022-009', 'ສັນຍາຂາຍໄຟ ນະຄອນຫຼວງ', 'ການໄຟຟ້ານະຄອນຫຼວງ', 10, 'MW', 950, 'LAK', 'ACTIVE', 1800, 60, 'ນະຄອນຫຼວງວຽງຈັນ'],
  ['SALE', 'PSA-EDL-2021-010', 'ສັນຍາຂາຍໄຟ ສະຖານີສູບນ້ຳ', 'ສະຖານີສູບນ້ຳ ຊົນລະປະທານ', 750, 'kW', 880, 'LAK', 'ACTIVE', 1400, 48, 'ແຂວງສະຫວັນນະເຂດ'],
  ['SALE', 'PSA-EDL-2024-011', 'ສັນຍາຂາຍໄຟ ໂທລະຄົມ', 'ບໍລິສັດ ໂທລະຄົມ', 60, 'kW', 1200, 'LAK', 'EXPIRING_SOON', 50, 36, 'ນະຄອນຫຼວງວຽງຈັນ'],
  ['SALE', 'PSA-EDL-2023-012', 'ສັນຍາຂາຍໄຟ ມະຫາວິທະຍາໄລ', 'ມະຫາວິທະຍາໄລແຫ່ງຊາດ', 3, 'MW', 0.09, 'USD', 'ACTIVE', 2600, 84, 'ນະຄອນຫຼວງວຽງຈັນ'],
];

/** Raw seed dated relative to `now`; ids ppa-1.. (notifications and attachments mocks reference them). */
export function createPowerContractSeed(now: Date = new Date()): RawPowerContract[] {
  return ROWS.map((r, i): RawPowerContract => {
    const [type, no, name, pc, cap, unit, tariff, cur, status, expDays, months, location] = r;
    const n = i + 1;
    const exp = expDays;
    const effective = exp - Math.round(months * 30.4);
    const dateFmt = (offset: number): string =>
      n % 4 === 0 ? `${isoDate(now, offset)}T00:00:00.000Z` : isoDate(now, offset);
    const draft = status === 'DRAFT';
    return {
      id: `ppa-${n}`,
      contractType: type,
      contractNumber: no,
      projectName: name,
      projectTypeOrCustomer: pc,
      durationText: months % 12 === 0 ? `${months / 12} ປີ` : `${months} ເດືອນ`,
      durationMonths: n % 3 === 0 ? String(months) : months,
      signedDate: draft ? null : dateFmt(effective - 20),
      effectiveDate: dateFmt(effective),
      expirationDate: dateFmt(exp),
      installedCapacity: `${cap} ${unit}`,
      capacityValue: n % 3 === 0 ? cap.toFixed(2) : cap,
      capacityUnit: unit,
      projectLocation: location,
      tariff: `${tariff} ${cur}/kWh`,
      tariffValue: n % 5 === 0 ? String(tariff) : tariff,
      tariffCurrency: cur,
      additionalDetails: n % 2 === 0 ? 'ໝາຍເຫດສັນຍາ' : null,
      notifyDaysBefore: 60,
      status,
      createdAt: new Date(now.getTime() - (40 - n) * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - (20 - (n % 10)) * 86400000).toISOString(),
    };
  });
}

let records: RawPowerContract[] = createPowerContractSeed();
let seq = 0;

/** In-memory store behind the mock handler. */
export const powerMockDb = {
  all: (): RawPowerContract[] => records,
  find: (id: string): RawPowerContract | undefined => records.find((r) => r.id === id),
  insert(rec: Omit<RawPowerContract, 'id'>): RawPowerContract {
    seq += 1;
    const created: RawPowerContract = { id: `ppa-new-${Date.now()}-${seq}`, ...rec };
    records = [created, ...records];
    return created;
  },
  remove(id: string): boolean {
    const before = records.length;
    records = records.filter((r) => r.id !== id);
    return records.length !== before;
  },
  reset(now: Date = new Date()): void {
    records = createPowerContractSeed(now);
  },
};
