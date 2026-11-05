import type { CoreModuleKey, PermissionActionKey } from '@/types/domain';
import type { RoleCreatePayload, RolePermission, RoleUpdatePayload } from '../types';

export function toRolePermissionsPayload(
  permissions: Record<CoreModuleKey, Record<PermissionActionKey, boolean>>,
): RolePermission[] {
  const legal = permissions.LEGAL_AND_DISPUTE;
  const candidates: RolePermission[] = [
    { module: 'CONTRACTS', ...permissions.CONTRACTS },
    { module: 'POWER_CONTRACTS', ...permissions.POWER_CONTRACTS },
    { module: 'LEGAL_DOCUMENTS', ...legal },
    { module: 'LEGAL_CASES', ...legal },
  ];

  return candidates.filter(
    (p) => p.canView || p.canUpload || p.canEdit || p.canDelete || p.canDownload,
  );
}

export function toRoleCreatePayload(
  name: string,
  title: string,
  description: string,
  permissions: Record<CoreModuleKey, Record<PermissionActionKey, boolean>>,
): RoleCreatePayload {
  const desc = description.trim();
  const perms = toRolePermissionsPayload(permissions);
  return {
    name: name.trim().toUpperCase(),
    title: title.trim() || name.trim(),
    ...(desc ? { description: desc } : {}),
    permissions: perms,
  };
}

export function toRoleUpdatePayload(
  name: string,
  title: string,
  description: string,
  permissions: Record<CoreModuleKey, Record<PermissionActionKey, boolean>>,
): RoleUpdatePayload {
  const desc = description.trim();
  const perms = toRolePermissionsPayload(permissions);
  return {
    name: name.trim().toUpperCase(),
    title: title.trim() || name.trim(),
    ...(desc ? { description: desc } : {}),
    permissions: perms,
  };
}

