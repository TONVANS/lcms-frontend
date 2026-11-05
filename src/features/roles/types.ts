import type { CoreModuleKey, PermissionActionKey } from '@/types/domain';

export interface RolePermission {
  module: CoreModuleKey | string;
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
}

export interface Role {
  id: string;
  name: string;
  title: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: RolePermission[];
  createdAt?: string | null;
}

export interface RoleCreatePayload {
  name: string;
  title: string;
  description?: string;
  permissions: RolePermission[];
}

export interface RoleUpdatePayload {
  name?: string;
  title?: string;
  description?: string;
  permissions?: RolePermission[];
}

export const ACTION_KEYS: readonly PermissionActionKey[] = [
  'canView',
  'canUpload',
  'canEdit',
  'canDelete',
  'canDownload',
] as const;

