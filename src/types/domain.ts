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
  | 'audit-logs';
export type UserRole = 'ADMIN' | 'MAIN_USER' | 'EDITOR' | 'VIEWER';
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
  position: string | null;
  role: UserRole;
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
  accessibleModules: SystemModule[];
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
