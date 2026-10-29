import type { SystemModule, User, UserRole } from '@/types/domain';

export const MOCK_PASSWORD = 'password';

const GC_DIVISION = 'ພະແນກສັນຍາທົ່ວໄປ';
const LEGAL_DIVISION = 'ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ';
const PPA_DIVISION = 'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ';
const DEPARTMENT = 'ຫ້ອງການ ຝ່າຍກົດໝາຍ ແລະ ສັນຍາ';

const COMMON: SystemModule[] = ['departments', 'support'];

const ALL_MODULES: SystemModule[] = [
  'contracts',
  'contract-types',
  'legal-documents',
  'legal-cases',
  'power-contracts',
  'power-notifications',
  'departments',
  'support',
  'users',
  'audit-logs',
];

type Flags = Pick<User, 'canView' | 'canUpload' | 'canEdit' | 'canDelete' | 'canDownload'>;
const ALL_FLAGS: Flags = { canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: true };
const EDITOR_FLAGS: Flags = { canView: true, canUpload: true, canEdit: true, canDelete: true, canDownload: false };
const VIEWER_FLAGS: Flags = { canView: true, canUpload: false, canEdit: false, canDelete: false, canDownload: false };

function mockUser(
  n: number,
  username: string,
  fullName: string,
  email: string,
  role: UserRole,
  division: string | null,
  flags: Flags,
  accessibleModules: SystemModule[],
): User {
  return {
    id: `u-${n}`,
    employeeCode: `EMP${String(1000 + n)}`,
    username,
    fullName,
    email,
    phone: `020 5${String(500000 + n * 111)}`,
    department: DEPARTMENT,
    division,
    position: null,
    role,
    ...flags,
    accessibleModules,
  };
}

export const MOCK_USERS: User[] = [
  mockUser(1, 'admin', 'ທ້າວ ສົມພອນ ວົງສະຫວັນ', 'somphone.v@lcms.la', 'ADMIN', null, ALL_FLAGS, ALL_MODULES),
  mockUser(
    2,
    'gc.user',
    'ທ້າວ ບຸນມີ ພົມມະວົງ',
    'bounmy.p@lcms.la',
    'MAIN_USER',
    GC_DIVISION,
    ALL_FLAGS,
    ['contracts', 'contract-types', ...COMMON],
  ),
  mockUser(
    3,
    'gc.editor',
    'ທ້າວ ໄຊສົມບັດ ລາວຫຼວງ',
    'xaysombath.l@lcms.la',
    'EDITOR',
    GC_DIVISION,
    EDITOR_FLAGS,
    ['contracts', 'contract-types', ...COMMON],
  ),
  mockUser(
    4,
    'gc.viewer',
    'ນາງ ພອນສະຫວັນ ທອງດີ',
    'phonsavanh.t@lcms.la',
    'VIEWER',
    GC_DIVISION,
    VIEWER_FLAGS,
    ['contracts', 'contract-types', ...COMMON],
  ),
  mockUser(
    5,
    'legal.user',
    'ນາງ ວິໄລວັນ ໄຊຍະວົງ',
    'vilayvanh.x@lcms.la',
    'MAIN_USER',
    LEGAL_DIVISION,
    ALL_FLAGS,
    ['legal-documents', 'legal-cases', ...COMMON],
  ),
  mockUser(
    6,
    'legal.editor',
    'ທ້າວ ບຸນມີ ສີວິໄລ',
    'bounmy.s@lcms.la',
    'EDITOR',
    LEGAL_DIVISION,
    EDITOR_FLAGS,
    ['legal-documents', 'legal-cases', ...COMMON],
  ),
  mockUser(
    7,
    'legal.viewer',
    'ນາງ ແກ້ວມະນີ ວົງສະຫວັນ',
    'keomany.v@lcms.la',
    'VIEWER',
    LEGAL_DIVISION,
    VIEWER_FLAGS,
    ['legal-documents', 'legal-cases', ...COMMON],
  ),
  mockUser(
    8,
    'ppa.user',
    'ນາງ ແກ້ວມະນີ ສີຫາລາດ',
    'kaewmany.s@lcms.la',
    'MAIN_USER',
    PPA_DIVISION,
    ALL_FLAGS,
    ['power-contracts', 'power-notifications', ...COMMON],
  ),
  mockUser(
    9,
    'none.user',
    'ນາງ ດາລາວັນ ສຸລິຍະວົງ',
    'dalavanh.s@lcms.la',
    'VIEWER',
    null,
    VIEWER_FLAGS,
    [...COMMON],
  ),
];
