export type ModuleKey = 'ppa' | 'gc' | 'legal';
export type Role = 'admin' | 'user';
export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: Role;
  departmentId: string;
  departmentName: string;
  modules: ModuleKey[]; // admin = all
  permissions?: Partial<Record<ModuleKey, Permission[]>>;
}

export interface Department {
  id: string;
  name: string;
}

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
  currency: 'LAK' | 'USD' | 'THB';
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
