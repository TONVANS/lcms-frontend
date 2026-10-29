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
}

export type EnergyType = 'hydro' | 'solar' | 'wind' | 'coal' | 'biomass';

export type ContractStatus =
  | 'draft'
  | 'negotiating'
  | 'pending_cod'
  | 'active'
  | 'expiring'
  | 'expired'
  | 'terminated';

export interface Money {
  amount: number;
  currency: 'LAK' | 'USD' | 'THB' | 'CNY';
}

export interface KeyEvent {
  type: string;
  label: string;
  date: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  mime: string;
  size: number;
  version: string;
  uploadedAt: string;
  uploadedBy: string;
  entityType: string;
  entityId: string;
}

export interface Alert {
  id: string;
  module: ModuleKey;
  entityType: string;
  entityId: string;
  title: string;
  dueDate: string;
  daysLeft: number;
  read: boolean;
}
