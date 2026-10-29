import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { unwrap, unwrapPage } from '@/lib/api/envelope';
import type { Paginated } from '@/types/api';
import { DEFAULT_PAGE_SIZE, EXPORT_PAGE_SIZE } from '../../constants';
import { toLegalCase, toLegalCasesDashboard } from '../lib/legal-case-mapper';
import type {
  CaseType,
  DisputeStatus,
  LegalCase,
  LegalCasePatch,
  LegalCasePayload,
  LegalCasesDashboard,
} from '../types';

export interface LegalCaseListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  caseType?: CaseType;
  disputeStatus?: DisputeStatus;
  departmentId?: string;
  /** YYYY-MM-DD */
  startDate?: string;
  /** YYYY-MM-DD */
  endDate?: string;
}

/** Store query -> backend query params (Ruling 8: no sort). Empty values are omitted. */
export function toLegalCaseListParams(q: LegalCaseListQuery = {}): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (q.page !== undefined) out.page = q.page;
  if (q.pageSize !== undefined) out.limit = q.pageSize;
  const search = q.q?.trim();
  if (search) out.search = search;
  if (q.caseType) out.caseType = q.caseType;
  if (q.disputeStatus) out.disputeStatus = q.disputeStatus;
  if (q.departmentId) out.departmentId = q.departmentId;
  if (q.startDate) out.startDate = q.startDate;
  if (q.endDate) out.endDate = q.endDate;
  return out;
}

export const legalCasesService = {
  list: (q: LegalCaseListQuery = {}): Promise<Paginated<LegalCase>> =>
    api
      .get<unknown>(endpoints.legalCases.list, { params: toLegalCaseListParams(q) })
      .then((r) =>
        unwrapPage(r.data, { page: q.page ?? 1, pageSize: q.pageSize ?? DEFAULT_PAGE_SIZE }, toLegalCase),
      ),

  /** Every row matching the filters (CSV export), fetched page by page. */
  async listAll(q: LegalCaseListQuery = {}): Promise<LegalCase[]> {
    const all: LegalCase[] = [];
    for (let page = 1; page <= 100; page += 1) {
      const res = await legalCasesService.list({ ...q, page, pageSize: EXPORT_PAGE_SIZE });
      all.push(...res.items);
      if (res.items.length < EXPORT_PAGE_SIZE || all.length >= res.total) break;
    }
    return all;
  },

  get: (id: string): Promise<LegalCase> =>
    api.get<unknown>(endpoints.legalCases.detail(id)).then((r) => toLegalCase(unwrap(r.data))),

  create: (body: LegalCasePayload): Promise<LegalCase> =>
    api.post<unknown>(endpoints.legalCases.list, body).then((r) => toLegalCase(unwrap(r.data))),

  update: (id: string, body: LegalCasePatch): Promise<LegalCase> =>
    api
      .patch<unknown>(endpoints.legalCases.detail(id), body)
      .then((r) => toLegalCase(unwrap(r.data))),

  remove: (id: string): Promise<void> =>
    api.delete<unknown>(endpoints.legalCases.detail(id)).then(() => undefined),

  dashboard: (): Promise<LegalCasesDashboard> =>
    api.get<unknown>(endpoints.legalCases.dashboard).then((r) => toLegalCasesDashboard(r.data)),
};
