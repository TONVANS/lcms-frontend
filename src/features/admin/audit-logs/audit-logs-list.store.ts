import {
  createListStore,
  createQueryCodec,
  useListUrlSync,
  DEFAULT_PAGE_SIZES,
} from '@/lib/list';
import { adminService } from '../admin.service';
import type { AuditLog, AuditLogQuery } from '../types';

export const AUDIT_LOG_PAGE_SIZES = DEFAULT_PAGE_SIZES;

export const auditLogsQueryCodec = createQueryCodec<AuditLogQuery>({
  defaults: { page: 1, pageSize: 20 },
  strings: {
    action: /^[\w-]+$/,
    userId: /^[\w.-]+$/,
  },
  pageSizes: AUDIT_LOG_PAGE_SIZES,
});

export const useAuditLogsListStore = createListStore<AuditLog, AuditLogQuery>(
  (q) => adminService.auditLogs.list(q),
  auditLogsQueryCodec.defaults,
);

export function useAuditLogsListUrlSync(): void {
  useListUrlSync(useAuditLogsListStore, auditLogsQueryCodec);
}

