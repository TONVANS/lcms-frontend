import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { toNum, toStr, unwrap, unwrapPage } from '@/lib/api/envelope';
import type { Paginated } from '@/types/api';
import { toAuditLog } from './audit-logs/audit-log-mapper';
import type { ContractTypePayload, DepartmentPayload } from './admin.schema';
import type {
  AdminListQuery,
  AuditLog,
  AuditLogQuery,
  ContractType,
  DepartmentRecord,
  SyncResult,
} from './types';

type Rec = Record<string, unknown>;

function rec(v: unknown): Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rec) : {};
}

function toBool(v: unknown): boolean {
  return v === false || v === 'false' || v === 0 ? false : true;
}

export function toContractType(raw: unknown): ContractType {
  const r = rec(raw);
  return {
    id: toStr(r.id) ?? '',
    nameLo: toStr(r.nameLo) ?? '',
    nameEn: toStr(r.nameEn),
    isActive: toBool(r.isActive),
  };
}

export function toDepartmentRecord(raw: unknown): DepartmentRecord {
  const r = rec(raw);
  return {
    id: toStr(r.id) ?? '',
    name: toStr(r.name) ?? '',
    code: toStr(r.code),
    isActive: toBool(r.isActive),
  };
}

function listParams(q: AdminListQuery): Record<string, string | boolean> {
  const params: Record<string, string | boolean> = {};
  const search = q.search?.trim();
  if (search) params.search = search;
  if (q.isActive !== undefined) params.isActive = q.isActive;
  return params;
}

function rows<T>(body: unknown, map: (raw: unknown) => T): T[] {
  return unwrapPage(body, { page: 1, pageSize: 1000 }, map).items;
}

export const adminService = {
  auditLogs: {
    list(q: AuditLogQuery): Promise<Paginated<AuditLog>> {
      const params: Record<string, string | number> = { page: q.page, limit: q.pageSize };
      if (q.action) params.action = q.action;
      const userId = q.userId?.trim();
      if (userId) params.userId = userId;
      return api
        .get(endpoints.auditLogs.list, { params })
        .then((r) => unwrapPage(r.data, { page: q.page, pageSize: q.pageSize }, toAuditLog));
    },
  },

  contractTypes: {
    list: (q: AdminListQuery): Promise<ContractType[]> =>
      api.get(endpoints.contractTypes.list, { params: listParams(q) }).then((r) => rows(r.data, toContractType)),
    create: (p: ContractTypePayload): Promise<ContractType> =>
      api.post(endpoints.contractTypes.list, p).then((r) => toContractType(unwrap(r.data))),
    update: (id: string, p: ContractTypePayload): Promise<ContractType> =>
      api.patch(endpoints.contractTypes.detail(id), p).then((r) => toContractType(unwrap(r.data))),
    remove: (id: string): Promise<void> =>
      api.delete(endpoints.contractTypes.detail(id)).then(() => undefined),
  },

  departments: {
    list: (q: AdminListQuery): Promise<DepartmentRecord[]> =>
      api.get(endpoints.departments.list, { params: listParams(q) }).then((r) => rows(r.data, toDepartmentRecord)),
    create: (p: DepartmentPayload): Promise<DepartmentRecord> =>
      api.post(endpoints.departments.list, p).then((r) => toDepartmentRecord(unwrap(r.data))),
    update: (id: string, p: DepartmentPayload): Promise<DepartmentRecord> =>
      api.patch(endpoints.departments.detail(id), p).then((r) => toDepartmentRecord(unwrap(r.data))),
    remove: (id: string): Promise<void> =>
      api.delete(endpoints.departments.detail(id)).then(() => undefined),
    sync: (): Promise<SyncResult> =>
      api.post(endpoints.departments.sync).then((r) => {
        const d = rec(unwrap(r.data));
        return { created: toNum(d.created), updated: toNum(d.updated), total: toNum(d.total) };
      }),
  },
};
