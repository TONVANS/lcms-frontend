import { addDays, format } from 'date-fns';
import type { Money } from '@/types/domain';
import type { GcContractInput } from '../schemas/gc.schema';
import { GC_CONTRACT_TYPES, type GcEquity, type GeneralContract } from '../types';

/** Local-time YYYY-MM-DD, `offset` days from `today` (never toISOString: that is UTC). */
function dayOffset(today: Date, offset: number): string {
  return format(addDays(today, offset), 'yyyy-MM-dd');
}

interface Spec {
  /** days from today to endDate; null = open-ended */
  end: number | null;
  /** days from today to effectiveDate (negative = already in force) */
  eff: number;
}

// 14 types x 3 slots = 42 contracts. Slot 0 of the first types carries the
// edge cases the status/alert tests need; the rest are comfortably active.
const SPECS: Spec[][] = [
  /* om_service       */ [{ end: 0, eff: -700 }, { end: -1, eff: -900 }, { end: 400, eff: -300 }],
  /* equipment_lease  */ [{ end: 3, eff: -500 }, { end: -10, eff: -800 }, { end: 250, eff: -200 }],
  /* land_lease       */ [{ end: 7, eff: -1200 }, { end: -25, eff: -1500 }, { end: 900, eff: -100 }],
  /* epc              */ [{ end: 25, eff: -600 }, { end: -40, eff: -700 }, { end: 150, eff: -60 }],
  /* pole_attachment  */ [{ end: 45, eff: -365 }, { end: -200, eff: -900 }, { end: 365, eff: -120 }],
  /* bill_collection  */ [{ end: 60, eff: -730 }, { end: 120, eff: -400 }, { end: 700, eff: -30 }],
  /* opgw_lease       */ [{ end: null, eff: -2000 }, { end: 61, eff: -500 }, { end: 500, eff: -50 }],
  /* current_deposit  */ [{ end: null, eff: -1000 }, { end: 200, eff: -300 }, { end: 800, eff: -10 }],
  /* edl_app_payment  */ [{ end: null, eff: -400 }, { end: 330, eff: -35 }, { end: 1000, eff: -5 }],
  /* cooperation      */ [{ end: 400, eff: 10 }, { end: 1200, eff: -600 }, { end: 90, eff: -275 }],
  /* shareholding     */ [{ end: 800, eff: 30 }, { end: 3000, eff: -1800 }, { end: 5000, eff: -2500 }],
  /* pta              */ [{ end: 1500, eff: 90 }, { end: 600, eff: -240 }, { end: 100, eff: -265 }],
  /* moa              */ [{ end: 180, eff: -150 }, { end: 270, eff: -90 }, { end: 450, eff: -20 }],
  /* other_assigned   */ [{ end: 220, eff: -140 }, { end: 365, eff: -70 }, { end: 540, eff: -1 }],
];

const COUNTERPARTIES = [
  'ບໍລິສັດ ລາວ ເທເລຄອມ ຈຳກັດ',
  'ທະນາຄານ ການຄ້າຕ່າງປະເທດລາວ',
  'Sinohydro Corporation',
  'ບໍລິສັດ ພະລັງງານ ສີຂອງ ຈຳກັດ',
  'China Southern Power Grid',
  'ບໍລິສັດ ກໍ່ສ້າງ ວຽງຈັນ ຈຳກັດ',
  null,
];

function valueFor(n: number): Money | null {
  switch (n % 5) {
    case 0:
      return { amount: 1_500_000_000 + n * 25_000_000, currency: 'LAK' };
    case 1:
      return { amount: 250_000 + n * 10_000, currency: 'USD' };
    case 2:
      return { amount: 1_800_000 + n * 50_000, currency: 'CNY' };
    case 3:
      return null;
    default:
      return { amount: 800_000_000 + n * 10_000_000, currency: 'LAK' };
  }
}

function equityFor(type: GeneralContract['type'], slot: number): GcEquity | null {
  if (type === 'shareholding') return { kind: 'percent', percent: [10, 25.5, 49][slot] };
  if (type === 'cooperation') {
    const currencies = ['USD', 'LAK', 'CNY'] as const;
    const amounts = [500_000, 2_000_000_000, 3_000_000];
    return { kind: 'amount', money: { amount: amounts[slot], currency: currencies[slot] } };
  }
  return null;
}

export function createGcSeed(today: Date = new Date()): GeneralContract[] {
  const stamp = today.toISOString();
  const out: GeneralContract[] = [];
  let n = 0;
  GC_CONTRACT_TYPES.forEach((type, ti) => {
    SPECS[ti].forEach((spec, slot) => {
      n += 1;
      const no = String(n).padStart(3, '0');
      const effective = dayOffset(today, spec.eff);
      out.push({
        id: `gc-${no}`,
        title: `${type.replace(/_/g, ' ')} agreement ${no}`,
        type,
        contractNo: `GC-2026-${no}`,
        counterparty: COUNTERPARTIES[n % COUNTERPARTIES.length],
        termText: spec.end === null ? null : `${Math.max(1, Math.round((spec.end - spec.eff) / 365))} ປີ`,
        signedDate: dayOffset(today, spec.eff - 14),
        effectiveDate: effective,
        endDate: spec.end === null ? null : dayOffset(today, spec.end),
        value: valueFor(n),
        equity: equityFor(type, slot),
        implementer: n % 3 === 0 ? null : 'ພະແນກສັນຍາທົ່ວໄປ',
        notes: n % 4 === 0 ? 'ໝາຍເຫດຕົວຢ່າງ' : null,
        createdAt: stamp,
        updatedAt: stamp,
        createdBy: 'admin',
      });
    });
  });
  return out;
}

let records: GeneralContract[] = createGcSeed();
let seq = 1000;

export const gcMockDb = {
  all(): GeneralContract[] {
    return records.map((c) => ({ ...c }));
  },
  get(id: string): GeneralContract | undefined {
    const c = records.find((r) => r.id === id);
    return c ? { ...c } : undefined;
  },
  insert(input: GcContractInput, by: string): GeneralContract {
    seq += 1;
    const now = new Date().toISOString();
    const created: GeneralContract = {
      ...input,
      id: `gc-${seq}`,
      createdAt: now,
      updatedAt: now,
      createdBy: by,
    };
    records = [created, ...records];
    return { ...created };
  },
  update(id: string, input: Partial<GcContractInput>): GeneralContract {
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error(`gc ${id} not found`);
    const next: GeneralContract = {
      ...records[idx],
      ...input,
      id,
      updatedAt: new Date().toISOString(),
    };
    records = records.map((r, i) => (i === idx ? next : r));
    return { ...next };
  },
  remove(id: string): void {
    records = records.filter((r) => r.id !== id);
  },
  reset(today: Date = new Date()): void {
    records = createGcSeed(today);
    seq = 1000;
  },
};
