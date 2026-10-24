import { format, subDays } from 'date-fns';
import { LEGAL_UNITS, type LegalUnit } from '../../constants';
import type { RegulationInput } from '../schemas/regulation.schema';
import type { Regulation, RegulationType } from '../types';

// Mock Lao text (titles, names, number abbreviations) is data, not UI copy. Names are fictional.

/** Short Lao abbreviation per unit, used as the suffix of regulation numbers. */
const UNIT_ABBR: Record<LegalUnit, string> = {
  edl_office: 'ຫສ',
  personnel: 'ຈຄ',
  legal_contract: 'ນຕ',
  inspection: 'ກຕ',
  accounting: 'ຝບຊ',
  ict: 'ເຕກ',
  edl_institute: 'ສຝ',
  business_planning: 'ຜທ',
  grid_north: 'ລຕ',
  grid_central: 'ລກ',
  grid_south: 'ລໃ',
  project_management: 'ບຄ',
};

const TYPE_PREFIX: Record<Exclude<RegulationType, 'other'>, string> = {
  decision: 'ຄຳຕັດສິນ',
  provision: 'ຂໍ້ກຳນົດ',
  notice: 'ແຈ້ງການ',
  rule: 'ລະບຽບ',
  instruction: 'ຄຳແນະນຳ',
};

const NON_OTHER_TYPES = ['decision', 'provision', 'notice', 'rule', 'instruction'] as const;

/** The one record whose type is `other`. */
const OTHER_INDEX = 17;

const SUBJECTS: string[] = [
  'ວ່າດ້ວຍ ການປະເມີນຜົນ KPIs ຂອງພະນັກງານ ແລະ ຫົວໜ່ວຍທຸລະກິດ',
  'ວ່າດ້ວຍ ການແຕ່ງຕັ້ງ ທ້າວ ສົມພອນ ວິໄລສັກ ເປັນຫົວໜ້າພະແນກນິຕິກຳ',
  'ວ່າດ້ວຍ ການຈັດຕັ້ງ ແລະ ການເຄື່ອນໄຫວຂອງຄະນະກຳມະການກວດກາ',
  'ວ່າດ້ວຍ ການເຄື່ອນຍ້າຍ ນ ຈັນທະວີ ແສງສຸວັນ ໄປປະຈຳສາຂາພາກກາງ',
  'ວ່າດ້ວຍ ການຄຸ້ມຄອງ ແລະ ນຳໃຊ້ລະບົບຂໍ້ມູນຂ່າວສານພາຍໃນ',
  'ວ່າດ້ວຍ ການເບີກຈ່າຍ ແລະ ຮັບຜິດຊອບງົບປະມານປະຈຳປີ',
  'ວ່າດ້ວຍ ການຝຶກອົບຮົມ ແລະ ພັດທະນາບຸກຄະລາກອນ',
  'ວ່າດ້ວຍ ການຄຸ້ມຄອງໂຄງການລົງທຶນ ແລະ ກໍ່ສ້າງພື້ນຖານໂຄງລ່າງ',
  'ວ່າດ້ວຍ ການແຕ່ງຕັ້ງ ທ້າວ ບຸນມີ ຈັນທະລາດ ເປັນຮອງຫົວໜ້າຝ່າຍບັນຊີ',
  'ວ່າດ້ວຍ ມາດຕະຖານຄວາມປອດໄພໃນການເຮັດວຽກເທິງສາຍສົ່ງໄຟຟ້າ',
  'ວ່າດ້ວຍ ການຄຸ້ມຄອງສັນຍາ ແລະ ການທົບທວນເອກະສານທາງກົດໝາຍ',
  'ວ່າດ້ວຍ ການຈັດຊື້ ຈັດຈ້າງ ວັດຖຸອຸປະກອນ ແລະ ການບໍລິການ',
  'ວ່າດ້ວຍ ການປະຕິບັດວຽກງານກວດກາພາຍໃນປະຈຳໄຕມາດ',
  'ວ່າດ້ວຍ ການຍົກເລີກຄຳສັ່ງເກົ່າ ກ່ຽວກັບການເຂົ້າ-ອອກວຽກ',
  'ວ່າດ້ວຍ ການແຕ່ງຕັ້ງ ນ ວັນນາ ພົມມະຈັນ ເປັນຜູ້ປະສານງານດ້ານນິຕິກຳ',
  'ວ່າດ້ວຍ ການຄຸ້ມຄອງຊັບສິນຂອງລັດວິສາຫະກິດ',
  'ວ່າດ້ວຍ ການຮັກສາຄວາມລັບ ແລະ ຄວາມປອດໄພຂອງຂໍ້ມູນ',
  'ບັນທຶກຄວາມເຂົ້າໃຈ ວ່າດ້ວຍ ການຮ່ວມມືດ້ານການຝຶກອົບຮົມ',
  'ວ່າດ້ວຍ ການບັນຈຸ ແລະ ການເລື່ອນຊັ້ນ-ຂັ້ນເງິນເດືອນ',
  'ວ່າດ້ວຍ ການເກັບຄ່າໄຟຟ້າ ແລະ ການແກ້ໄຂຄຳຮ້ອງທຸກຂອງລູກຄ້າ',
  'ວ່າດ້ວຍ ການແຕ່ງຕັ້ງ ທ້າວ ຄຳຜຸຍ ສີສະຫວັດ ເປັນຫົວໜ້າໂຄງການ',
  'ວ່າດ້ວຍ ການຄຸ້ມຄອງຄວາມສ່ຽງ ແລະ ແຜນສຸກເສີນ',
  'ວ່າດ້ວຍ ການຈັດສັນທີ່ດິນ ແລະ ການຊົດເຊີຍຜູ້ໄດ້ຮັບຜົນກະທົບ',
  'ວ່າດ້ວຍ ການນຳໃຊ້ຍານພາຫະນະຂອງອົງການ',
  'ວ່າດ້ວຍ ການແຕ່ງຕັ້ງ ນ ແກ້ວມະນີ ລາດຊະວົງ ເປັນເລຂານຸການ',
  'ວ່າດ້ວຍ ການກຳນົດອັດຕາຄ່າໃຊ້ຈ່າຍໃນການເດີນທາງໄປປະຕິບັດວຽກງານ',
  'ວ່າດ້ວຍ ການສ້າງ ແລະ ການນຳໃຊ້ແຜນພັດທະນາທຸລະກິດ 5 ປີ',
  'ວ່າດ້ວຍ ການບໍລິຫານສັນຍາ ແລະ ການແກ້ໄຂຂໍ້ຂັດແຍ່ງ',
  'ວ່າດ້ວຍ ການປະເມີນຜົນການປະຕິບັດວຽກງານຂອງຫົວໜ່ວຍ',
  'ວ່າດ້ວຍ ການປັບປຸງຂັ້ນຕອນການອະນຸມັດເອກະສານທາງກົດໝາຍ',
];

const PURPOSES: Array<string | null> = [
  'ເພື່ອກຳນົດຕົວຊີ້ວັດ ແລະ ວິທີການປະເມີນຜົນການປະຕິບັດໜ້າທີ່',
  null,
  'ເພື່ອໃຫ້ການຈັດຕັ້ງປະຕິບັດເປັນເອກະພາບ ແລະ ມີປະສິດທິຜົນ',
  null,
  null,
];

/** 23 June of `today`'s year, or of the previous year when that date is still ahead. */
function sampleIssuedDate(today: Date): { date: string; year: number } {
  const todayStr = format(today, 'yyyy-MM-dd');
  let year = today.getFullYear();
  if (`${year}-06-23` > todayStr) year -= 1;
  return { date: `${year}-06-23`, year };
}

function linksFor(n: number): string[] {
  if (n % 7 === 0) {
    return [
      `https://laws.example.la/regulations/${n}`,
      `https://edl.example.la/documents/regulation-${n}.pdf`,
    ];
  }
  if (n % 5 === 2) return [`https://laws.example.la/regulations/${n}`];
  return [];
}

export function createRegulationSeed(today: Date = new Date()): Regulation[] {
  const stamp = today.toISOString();
  const out: Regulation[] = [];
  for (let n = 1; n <= 30; n += 1) {
    const unit = LEGAL_UNITS[(n + 3) % LEGAL_UNITS.length]; // n=1 -> accounting
    const type: RegulationType =
      n === OTHER_INDEX ? 'other' : NON_OTHER_TYPES[(n - 1) % NON_OTHER_TYPES.length];
    const prefix = type === 'other' ? '' : `${TYPE_PREFIX[type]} `;
    const sample = n === 1 ? sampleIssuedDate(today) : null;
    const issuedDate = sample ? sample.date : format(subDays(today, 12 * n + 5), 'yyyy-MM-dd');
    const no = n === 1 ? 351 : 100 + n * 11;
    out.push({
      id: `reg-${n}`,
      title: `${prefix}${SUBJECTS[n - 1]}`,
      type,
      typeOther: type === 'other' ? 'ບັນທຶກຄວາມເຂົ້າໃຈ' : null,
      number: `${no}/ຟຟລ.${UNIT_ABBR[unit]}`,
      issuedDate,
      year: sample ? sample.year : Number(issuedDate.slice(0, 4)),
      purpose: PURPOSES[(n - 1) % PURPOSES.length],
      responsible: n % 3 === 0 ? null : 'ພະແນກນິຕິກຳ',
      unit,
      status: n === 1 ? 'in_force' : n % 4 === 0 ? 'repealed' : 'in_force',
      externalLinks: linksFor(n),
      createdAt: stamp,
      updatedAt: stamp,
      createdBy: 'admin',
    });
  }
  return out;
}

let records: Regulation[] = createRegulationSeed();
let seq = 1000;

const copy = (r: Regulation): Regulation => ({ ...r, externalLinks: [...r.externalLinks] });

export const regulationsMockDb = {
  all(): Regulation[] {
    return records.map(copy);
  },
  get(id: string): Regulation | undefined {
    const r = records.find((x) => x.id === id);
    return r ? copy(r) : undefined;
  },
  insert(input: RegulationInput, by: string): Regulation {
    seq += 1;
    const now = new Date().toISOString();
    const created: Regulation = {
      ...input,
      externalLinks: [...input.externalLinks],
      id: `reg-${seq}`,
      createdAt: now,
      updatedAt: now,
      createdBy: by,
    };
    records = [created, ...records];
    return copy(created);
  },
  update(id: string, input: Partial<RegulationInput>): Regulation {
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error(`regulation ${id} not found`);
    const next: Regulation = {
      ...records[idx],
      ...input,
      id,
      updatedAt: new Date().toISOString(),
    };
    if (input.externalLinks) next.externalLinks = [...input.externalLinks];
    records = records.map((r, i) => (i === idx ? next : r));
    return copy(next);
  },
  remove(id: string): void {
    records = records.filter((r) => r.id !== id);
  },
  reset(today: Date = new Date()): void {
    records = createRegulationSeed(today);
    seq = 1000;
  },
};
