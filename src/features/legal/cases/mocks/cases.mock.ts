import { format, subDays } from 'date-fns';
import type { CaseInput, CaseStage, CaseType, DualAmount, LegalCase } from '../types';

const DEFENDANTS: string[] = [
  'ທ້າວ ສົມສັກ ແກ້ວມະນີ',
  'ບໍລິສັດ ພັດທະນາພະລັງງານ ຈຳກັດ',
  'ນາງ ວັນເພັງ ຈັນທະວົງ',
  'ທ້າວ ບຸນທັນ ສີປະເສີດ',
  'ບໍລິສັດ ກໍ່ສ້າງຂົວທາງ ແລະ ຊົນລະປະທານ ຈຳກັດ',
  'ທ້າວ ຄຳຫຼ້າ ວົງສະຫວັນ',
  'ນາງ ມະນີວອນ ພົມມະຈັນ',
  'ບໍລິສັດ ການຄ້າ ແລະ ຂົນສົ່ງ ສາກົນ ຈຳກັດ',
  'ທ້າວ ສົມພອນ ວິໄລສັກ',
  'ທ້າວ ສຸລິວັນ ໄຊຍະສິດ',
  'ບໍລິສັດ ໄຟຟ້າພະລັງງານສະອາດ ຈຳກັດ',
  'ນາງ ແສງດາວ ລາດຊະວົງ',
  'ທ້າວ ທອງດີ ມະນີວົງ',
  'ບໍລິສັດ ວຽງຈັນ ວິສະວະກຳ ຈຳກັດ',
  'ນາງ ບົວຄຳ ສີຫາລາດ',
  'ທ້າວ ອາລຸນ ແສງມະນີ',
  'ບໍລິສັດ ຈະເລີນຊັບ ກໍ່ສ້າງ ຈຳກັດ',
  'ທ້າວ ຄຳແພງ ດວງພະຈັນ',
  'ນາງ ຈິນດາ ວົງພະຈັນ',
  'ບໍລິສັດ ລາວໂທລະຄົມມະນາຄົມ ຈຳກັດ',
  'ທ້າວ ໄຊຍະພອນ ໄຊຍະວົງ',
  'ນາງ ດາວອນ ພິມມະສອນ',
  'ທ້າວ ວິໄລສັກ ສຸວັນນະວົງ',
  'ບໍລິສັດ ອຸດສາຫະກຳ ແລະ ບໍ່ແຮ່ ຈຳກັດ',
];

const ALLEGATIONS: string[] = [
  'ລັກລອບຕັດສາຍສົ່ງໄຟຟ້າແຮງສູງ ແລະ ທຳລາຍຊັບສິນລັດ',
  'ລະເມີດສັນຍາຊື້-ຂາຍກະແສໄຟຟ້າ ແລະ ຄ້າງຊຳລະເງິນ',
  'ບຸກລຸກເຂດສະຫງວນແລວສາຍສົ່ງໄຟຟ້າ',
  'ສໍ້ໂກງຊັບສິນຂອງລັດວິສາຫະກິດໄຟຟ້າລາວ',
  'ບໍ່ປະຕິບັດຕາມສັນຍາກໍ່ສ້າງສະຖານີໄຟຟ້າຍ່ອຍ',
  'ລັກລອບຕໍ່ສາຍໄຟຟ້າຊົມໃຊ້ໂດຍບໍ່ຜ່ານກົງເຕີ',
  'ສ້າງຄວາມເສຍຫາຍແກ່ໝໍ້ແປງໄຟຟ້າຊຸມຊົນ',
  'ຄ້າງຊຳລະຄ່າພະລັງງານໄຟຟ້າຂ້າມແດນ',
  'ສໍ້ລາດບັງຫຼວງໃນໂຄງການຈັດຊື້-ຈັດຈ້າງ',
  'ລັກຊັບເຄື່ອງມື ແລະ ອຸປະກອນໄຟຟ້າສາງພາກກາງ',
  'ຜິດສັນຍາສຳປະທານໂຄງການເຂື່ອນໄຟຟ້າຂະໜາດນ້ອຍ',
  'ລະເມີດມາດຕະການຄວາມປອດໄພເປັນເຫດໃຫ້ເກີດໄຟໄໝ້',
  'ການບຸກເບີກທີ່ດິນກະທົບຕໍ່ເສົາສາຍສົ່ງແຮງສູງ',
  'ບໍ່ຊຳລະຄ່າເສຍຫາຍຕາມຄຳຕັດສິນຂອງສານ',
  'ປອມແປງເອກະສານການເບີກຈ່າຍເງິນໂຄງການ',
  'ລະເມີດຂໍ້ກຳນົດສິ່ງແວດລ້ອມເຂດອ່າງໂຕ່ງເຂື່ອນ',
  'ຄ້າງຊຳລະຄ່າເຊົ່າເສົາສາຍສົ່ງໂທລະຄົມມະນາຄົມ',
  'ການນຳໃຊ້ໄຟຟ້າຜິດປະເພດທຸລະກິດ',
  'ທຳລາຍຊັບສິນອຸປະກອນວັດແທກກະແສໄຟຟ້າ',
  'ລະເມີດສັນຍາການເຊົ່າຊັບສິນອາຄານສຳນັກງານ',
  'ການດຳເນີນທຸລະກິດບໍ່ສອດຄ່ອງກັບໃບອະນຸຍາດ',
  'ລັກລອບຂາຍອຸປະກອນໄຟຟ້າເກົ່າຂອງລັດ',
  'ຜິດສັນຍາການບຳລຸງຮັກສາລະບົບຄວບຄຸມໄຟຟ້າ',
  'ການຊົດເຊີຍຜົນກະທົບຕໍ່ປະຊາຊົນບໍ່ຄົບຖ້ວນ',
];

const HANDLING_UNITS: string[] = [
  'ສານປະຊາຊົນນະຄອນຫຼວງວຽງຈັນ',
  'ສານປະຊາຊົນເຂດ 1 ນະຄອນຫຼວງ',
  'ອົງການໄອຍະການປະຊາຊົນສູງສຸດ',
  'ຝ່າຍກົດໝາຍ-ສັນຍາ ຟຟລ',
  'ສານປະຊາຊົນແຂວງວຽງຈັນ',
  'ສານປະຊາຊົນແຂວງຫຼວງພະບາງ',
  'ສານປະຊາຊົນແຂວງຈຳປາສັກ',
  'ອົງການໄອຍະການປະຊາຊົນພາກກາງ',
];

const PROGRESS_NOTES: Array<string | null> = [
  'ສານຂັ້ນຕົ້ນຕັດສິນໃຫ້ຊົດໃຊ້ຄ່າເສຍຫາຍ',
  'ລໍຖ້າການໄຕ່ສວນຂອງສານອຸທອນ',
  'ກຳລັງຮວບຮວມຫຼັກຖານ ແລະ ເອກະສານທີ່ກ່ຽວຂ້ອງ',
  'ສຳເລັດການປະຕິບັດຄຳຕັດສິນ ແລະ ຊຳລະຄົບຖ້ວນ',
  'ຍຸຕິຄະດີເນື່ອງຈາກໄກ່ເກ່ຍສຳເລັດ',
  'ລໍຖ້າຄຳຕັດສິນຂອງສານຂັ້ນລົບລ້າງ',
  'ອົງການໄອຍະການສັ່ງຟ້ອງຂຶ້ນສານ',
  null,
];

const STAGES: CaseStage[] = [
  'first_instance',
  'appeal',
  'cassation',
  'completed',
  'closed',
];

const TYPES: CaseType[] = ['civil', 'criminal', 'commercial', 'other'];

interface SeedAmounts {
  damage: DualAmount;
  fine: DualAmount;
  recovered: DualAmount;
}

function getAmountsForIndex(n: number): SeedAmounts {
  // n is 1-based (1..24)
  switch (n) {
    case 1:
      // LAK-only, recovered partial
      return {
        damage: { lak: 10_000_000, usd: null },
        fine: { lak: 2_000_000, usd: null },
        recovered: { lak: 5_000_000, usd: null },
      };
    case 2:
      // USD-only, recovered 0
      return {
        damage: { lak: null, usd: 5_000 },
        fine: { lak: null, usd: 1_000 },
        recovered: { lak: null, usd: 0 },
      };
    case 3:
      // all-null
      return {
        damage: { lak: null, usd: null },
        fine: { lak: null, usd: null },
        recovered: { lak: null, usd: null },
      };
    case 4:
      // recovered equal to its total
      return {
        damage: { lak: 20_000_000, usd: null },
        fine: { lak: 0, usd: null },
        recovered: { lak: 20_000_000, usd: null },
      };
    case 5:
      // mixed
      return {
        damage: { lak: 15_000_000, usd: 2_000 },
        fine: { lak: 0, usd: 500 },
        recovered: { lak: 5_000_000, usd: 1_000 },
      };
    case 6:
      // disputeDate is null
      return {
        damage: { lak: 30_000_000, usd: null },
        fine: { lak: 5_000_000, usd: null },
        recovered: { lak: 10_000_000, usd: null },
      };
    default: {
      const lakBase = (n * 3_500_000) % 50_000_000;
      const usdBase = n % 3 === 0 ? (n * 500) % 10_000 : null;
      return {
        damage: { lak: lakBase, usd: usdBase },
        fine: { lak: Math.floor(lakBase * 0.1), usd: usdBase ? Math.floor(usdBase * 0.1) : null },
        recovered: { lak: Math.floor(lakBase * 0.3), usd: usdBase ? Math.floor(usdBase * 0.3) : null },
      };
    }
  }
}

export function createCaseSeed(today: Date = new Date()): LegalCase[] {
  const stamp = today.toISOString();
  const year = today.getFullYear();
  const out: LegalCase[] = [];

  for (let n = 1; n <= 24; n += 1) {
    const stage = STAGES[(n - 1) % STAGES.length];
    const caseType = TYPES[(n - 1) % TYPES.length];
    const amounts = getAmountsForIndex(n);
    const disputeDate =
      n === 6
        ? null
        : format(subDays(today, 15 * n + 3), 'yyyy-MM-dd');

    out.push({
      id: `case-${n}`,
      caseNo: `LC-${year}-${String(n).padStart(3, '0')}`,
      defendant: DEFENDANTS[n - 1],
      allegation: ALLEGATIONS[n - 1],
      handlingUnit: HANDLING_UNITS[(n - 1) % HANDLING_UNITS.length],
      caseType,
      stage,
      damage: amounts.damage,
      fine: amounts.fine,
      recovered: amounts.recovered,
      disputeDate,
      progress: PROGRESS_NOTES[(n - 1) % PROGRESS_NOTES.length],
      createdAt: stamp,
      updatedAt: stamp,
      createdBy: 'admin',
    });
  }

  return out;
}

let records: LegalCase[] = createCaseSeed();
let seq = 1000;

const copyDual = (d: DualAmount): DualAmount => ({ lak: d.lak, usd: d.usd });

const copy = (c: LegalCase): LegalCase => ({
  ...c,
  damage: copyDual(c.damage),
  fine: copyDual(c.fine),
  recovered: copyDual(c.recovered),
});

export const casesMockDb = {
  all(): LegalCase[] {
    return records.map(copy);
  },
  get(id: string): LegalCase | undefined {
    const c = records.find((x) => x.id === id);
    return c ? copy(c) : undefined;
  },
  insert(input: CaseInput, by: string): LegalCase {
    seq += 1;
    const now = new Date();
    const year = now.getFullYear();
    const prefix = `LC-${year}-`;
    let maxN = 0;
    for (const r of records) {
      if (r.caseNo.startsWith(prefix)) {
        const numPart = parseInt(r.caseNo.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxN) {
          maxN = numPart;
        }
      }
    }
    const nextN = maxN + 1;
    const caseNo = `${prefix}${String(nextN).padStart(3, '0')}`;
    const isoNow = now.toISOString();

    const created: LegalCase = {
      ...input,
      id: `case-${seq}`,
      caseNo,
      damage: copyDual(input.damage),
      fine: copyDual(input.fine),
      recovered: copyDual(input.recovered),
      createdAt: isoNow,
      updatedAt: isoNow,
      createdBy: by,
    };
    records = [created, ...records];
    return copy(created);
  },
  update(id: string, input: Partial<CaseInput>): LegalCase {
    const idx = records.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error(`case ${id} not found`);
    const existing = records[idx];
    const next: LegalCase = {
      ...existing,
      ...input,
      id,
      caseNo: existing.caseNo, // caseNo is read-only everywhere
      damage: input.damage ? copyDual(input.damage) : copyDual(existing.damage),
      fine: input.fine ? copyDual(input.fine) : copyDual(existing.fine),
      recovered: input.recovered ? copyDual(input.recovered) : copyDual(existing.recovered),
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      updatedAt: new Date().toISOString(),
    };
    records = records.map((c, i) => (i === idx ? next : c));
    return copy(next);
  },
  remove(id: string): void {
    records = records.filter((c) => c.id !== id);
  },
  reset(today: Date = new Date()): void {
    records = createCaseSeed(today);
    seq = 1000;
  },
};
