import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { toStr, unwrap } from '@/lib/api/envelope';
import type { Role, RoleCreatePayload, RolePermission, RoleUpdatePayload } from '../types';

function rec(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function toRolePermission(raw: unknown): RolePermission {
  const r = rec(raw);
  return {
    module: toStr(r.module) ?? '',
    canView: r.canView === true,
    canUpload: r.canUpload === true,
    canEdit: r.canEdit === true,
    canDelete: r.canDelete === true,
    canDownload: r.canDownload === true,
  };
}

export function toRole(raw: unknown): Role {
  const r = rec(raw);
  const rawPerms = Array.isArray(r.permissions) ? r.permissions : [];
  return {
    id: toStr(r.id) ?? '',
    name: toStr(r.name) ?? '',
    title: toStr(r.title) ?? toStr(r.name) ?? '',
    description: toStr(r.description),
    isSystem: r.isSystem === true,
    userCount: typeof r.userCount === 'number' ? r.userCount : 0,
    permissions: rawPerms.map(toRolePermission),
    createdAt: toStr(r.createdAt),
  };
}

export const rolesService = {
  list: async (): Promise<Role[]> => {
    const res = await api.get<unknown>(endpoints.roles.list);
    const data = unwrap<unknown>(res.data);
    if (!Array.isArray(data)) return [];
    return data.map(toRole);
  },

  get: async (id: string): Promise<Role> => {
    const res = await api.get<unknown>(endpoints.roles.detail(id));
    return toRole(unwrap(res.data));
  },

  create: async (dto: RoleCreatePayload): Promise<Role> => {
    const res = await api.post<unknown>(endpoints.roles.list, dto);
    return toRole(unwrap(res.data));
  },

  update: async (id: string, dto: RoleUpdatePayload): Promise<Role> => {
    const res = await api.patch<unknown>(endpoints.roles.detail(id), dto);
    return toRole(unwrap(res.data));
  },

  remove: async (id: string): Promise<void> => {
    await api.delete<unknown>(endpoints.roles.detail(id));
  },
};

