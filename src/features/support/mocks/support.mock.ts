/** Raw (backend-shaped) mock support data; dates are relative to today. */

function ago(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function createContactSeed(): Record<string, unknown>[] {
  return [
    { id: 1, channelName: 'ໂທລະສັບ IT Support', contactInfo: '+856 21 000 000', description: 'ຈັນ-ສຸກ 08:00-17:00', sortOrder: 1, isActive: true },
    { id: 2, channelName: 'ອີເມວ', contactInfo: 'support@lcms.example', description: null, sortOrder: 2, isActive: true },
    { id: 3, channelName: 'WhatsApp', contactInfo: '+856 20 5555 0000', description: 'ກໍລະນີດ່ວນ', sortOrder: 3, isActive: true },
    { id: 4, channelName: 'ຫ້ອງການ IT', contactInfo: 'ຊັ້ນ 3 ອາຄານ A', description: 'ມາພົບໂດຍກົງ', sortOrder: 4, isActive: true },
  ];
}

const USERS: Record<string, { id: string; fullName: string }> = {
  admin: { id: 'u-1', fullName: 'ທ້າວ ສົມພອນ ວົງສະຫວັນ' },
  gc: { id: 'u-2', fullName: 'ທ້າວ ບຸນມີ ພົມມະວົງ' },
  legal: { id: 'u-5', fullName: 'ນາງ ແສງດາວ ສີວິໄລ' },
};

type Who = keyof typeof USERS;

const SEEDS: Array<[Who, string, string, string, string, number, boolean, string | null]> = [
  ['gc', 'ເຂົ້າສູ່ລະບົບບໍ່ໄດ້', 'ປ້ອນລະຫັດຖືກແຕ່ເຂົ້າບໍ່ໄດ້', 'URGENT', 'OPEN', 0, true, null],
  ['gc', 'ຢາກໃຫ້ມີປຸ່ມສົ່ງອອກ Excel', 'ໜ້າລາຍການສັນຍາຄວນມີ Excel', 'LOW', 'IN_PROGRESS', 1, false, 'ກຳລັງພິຈາລະນາ'],
  ['admin', 'ລາຍງານໂຫຼດຊ້າ', 'ໜ້າພາບລວມໂຫຼດເກີນ 10 ວິນາທີ', 'HIGH', 'IN_PROGRESS', 2, true, null],
  ['legal', 'ຕົວອັກສອນຊ້ອນກັນ', 'ໜ້າຄະດີຕົວອັກສອນຊ້ອນກັນໃນມືຖື', 'MEDIUM', 'OPEN', 3, true, null],
  ['gc', 'ອັບໂຫຼດເອກະສານຜິດພາດ', 'ໄຟລ໌ PDF 10MB ອັບໂຫຼດບໍ່ໄດ້', 'HIGH', 'RESOLVED', 5, false, 'ແກ້ໄຂແລ້ວ ລອງໃໝ່'],
  ['admin', 'ເພີ່ມຜູ້ໃຊ້ໃໝ່', 'ຂໍເພີ່ມສິດໃຫ້ພະນັກງານໃໝ່', 'MEDIUM', 'CLOSED', 7, false, 'ດຳເນີນການແລ້ວ'],
  ['legal', 'ວັນທີບໍ່ຖືກຕ້ອງ', 'ວັນທີນັດໄຕ່ສວນສະແດງຜິດ', 'MEDIUM', 'RESOLVED', 9, false, 'ປັບປຸງແລ້ວ'],
  ['gc', 'ແຈ້ງເຕືອນບໍ່ມາ', 'ບໍ່ໄດ້ຮັບແຈ້ງເຕືອນສັນຍາໃກ້ໝົດອາຍຸ', 'HIGH', 'OPEN', 10, false, null],
  ['admin', 'ສະເໜີໂໝດມືດ', 'ຢາກໃຫ້ປັບສີໂໝດມືດໃຫ້ອ່ານງ່າຍຂຶ້ນ', 'LOW', 'CLOSED', 14, false, null],
  ['legal', 'ຄົ້ນຫາບໍ່ເຈໍຜົນ', 'ຄົ້ນຫານິຕິກຳດ້ວຍເລກທີບໍ່ເຈີ', 'MEDIUM', 'IN_PROGRESS', 15, true, null],
  ['legal', 'ພິມເອກະສານຜິດຂະໜາດ', 'ພິມລາຍງານແລ້ວຕົກຂອບ', 'LOW', 'OPEN', 18, false, null],
  ['admin', 'ລະບົບຂັດຂ້ອງຕອນເຊົ້າ', 'ເຂົ້າບໍ່ໄດ້ຊ່ວງ 08:00-08:30', 'URGENT', 'RESOLVED', 20, false, 'ແກ້ໄຂ server ແລ້ວ'],
];

export function createTicketSeed(): Record<string, unknown>[] {
  return SEEDS.map(([who, subject, description, priority, status, daysAgo, attach, note], i) => ({
    id: `t-${String(i + 1).padStart(3, '0')}`,
    subject,
    description,
    priority,
    status,
    adminNote: note,
    attachmentUrl: attach ? `/uploads/support/t-${i + 1}.png` : null,
    createdAt: ago(daysAgo),
    updatedAt: ago(Math.max(0, daysAgo - 1)),
    createdById: USERS[who].id,
    createdBy: USERS[who],
  }));
}
