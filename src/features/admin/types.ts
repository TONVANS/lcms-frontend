import type { HistoryEntry } from '@/types/domain';

export type AuditChange = HistoryEntry['changes'][number];

export interface AuditLog {
  id: string;
  action: string;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  ipAddress: string | null;
  changes: AuditChange[];
}

export interface AuditLogQuery {
  page: number;
  pageSize: number;
  /** Backend action enum value. */
  action?: string;
  userId?: string;
}

export interface ContractType {
  id: string;
  nameLo: string;
  nameEn: string | null;
  isActive: boolean;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
}

export interface AdminListQuery {
  search?: string;
  isActive?: boolean;
}

export interface SyncResult {
  created: number | null;
  updated: number | null;
  total: number | null;
}
