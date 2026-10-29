import { api } from '@/lib/api/client';
import { unwrapPage } from '@/lib/api/envelope';
import { endpoints } from '@/lib/api/endpoints';
import type { Paginated } from '@/types/api';
import type { HistoryEntry } from '@/types/domain';
import { toHistoryEntry } from '../lib/history-mapper';
import type { HistoryKind } from '../types';

export interface HistoryQuery {
  page: number;
  pageSize: number;
  /** Backend action enum value, e.g. `UPDATE_CONTRACT`. */
  action?: string;
}

export const historyService = {
  list: (kind: HistoryKind, id: string, q: HistoryQuery): Promise<Paginated<HistoryEntry>> => {
    const url = kind === 'contracts' ? endpoints.contracts.history(id) : endpoints.powerContracts.history(id);
    const params: Record<string, string | number> = { page: q.page, limit: q.pageSize };
    if (q.action) params.action = q.action;
    return api
      .get(url, { params })
      .then((r) => unwrapPage(r.data, { page: q.page, pageSize: q.pageSize }, toHistoryEntry));
  },
};
