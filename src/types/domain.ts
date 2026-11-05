/** 3 Core Pillars (Modules) in EDL Legal System */
export type CoreModuleKey = 'CONTRACTS' | 'POWER_CONTRACTS' | 'LEGAL_AND_DISPUTE';

/** All Module Keys supported by Backend RBAC */
export type SystemModuleKey = CoreModuleKey | 'LEGAL_DOCUMENTS' | 'LEGAL_CASES' | string;

export type PermissionActionKey = 'canView' | 'canUpload' | 'canEdit' | 'canDelete' | 'canDownload';

export interface ModulePermission {
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
}

export interface PillarRowConfig {
  key: CoreModuleKey;
  label: string;
  divisionLabel: string;
  backendKeys: string[];
}

export const PILLAR_MODULES: PillarRowConfig[] = [
  {
    key: 'CONTRACTS',
    label: '1. ສັນຍາທົ່ວໄປ (General Contracts)',
    divisionLabel: 'ພະແນກສັນຍາທົ່ວໄປ',
    backendKeys: ['CONTRACTS'],
  },
  {
    key: 'POWER_CONTRACTS',
    label: '2. ສັນຍາຊື້-ຂາຍໄຟຟ້າ (Power Contracts)',
    divisionLabel: 'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ',
    backendKeys: ['POWER_CONTRACTS'],
  },
  {
    key: 'LEGAL_AND_DISPUTE',
    label: '3. ນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (Legal Affairs & Disputes)',
    divisionLabel: 'ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ',
    backendKeys: ['LEGAL_AND_DISPUTE', 'LEGAL_DOCUMENTS', 'LEGAL_CASES'],
  },
];

/** Backend RBAC module names (`accessibleModules` on the user profile). */
export type SystemModule =
  | 'contracts'
  | 'contract-types'
  | 'legal-documents'
  | 'legal-cases'
  | 'power-contracts'
  | 'power-notifications'
  | 'departments'
  | 'support'
  | 'users'
  | 'audit-logs'
  | string;

export type UserRole = 'ADMIN' | 'MAIN_USER' | 'DEPARTMENT_HEAD' | 'EDITOR' | 'VIEWER' | string;
/** UI module keys, derived from `SystemModule` (see `getAccessibleModules`). */
export type ModuleKey = 'ppa' | 'gc' | 'legal';
export type AttachmentModule = 'contracts' | 'legal-documents' | 'legal-cases' | 'power-contracts';
export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'download';

export interface User {
  id: string;
  employeeCode: string | null;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  division: string | null;
  unit?: string | null;
  position: string | null;
  role: UserRole;
  roleId?: string | null;
  roleTitle?: string | null;
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
  accessibleModules: SystemModule[];
  permissionsByModule?: Record<string, ModulePermission>;
}

export interface Department {
  id: string;
  name: string;
  code: string | null;
}

export interface ContractTypeOption {
  id: number;
  nameLo: string;
  nameEn: string | null;
}

export type Currency = 'LAK' | 'USD' | 'CNY';

/** Backend contract status (computed server-side). */
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TERMINATED';

export interface Money {
  amount: number;
  currency: 'LAK' | 'USD' | 'THB' | 'CNY';
}

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: string | null;
}

export interface HistoryEntry {
  id: string;
  action: string;
  createdAt: string;
  userName: string | null;
  changes: { field: string; label: string; oldValue: string | null; newValue: string | null }[];
}
