import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { unwrap, unwrapPage } from '@/lib/api/envelope';
import type { Paginated } from '@/types/api';
import { DEFAULT_PAGE_SIZE, EXPORT_PAGE_SIZE } from '../../constants';
import { toLegalDocument, toLegalDocumentsDashboard } from '../lib/legal-document-mapper';
import type {
  DocStatus,
  DocType,
  LegalDocument,
  LegalDocumentPatch,
  LegalDocumentPayload,
  LegalDocumentsDashboard,
} from '../types';

export interface LegalDocumentListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  docType?: DocType;
  status?: DocStatus;
  issueYear?: number;
  departmentId?: string;
}

/** Store query -> backend query params (Ruling 8: no sort). Empty values are omitted. */
export function toLegalDocumentListParams(
  q: LegalDocumentListQuery = {},
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (q.page !== undefined) out.page = q.page;
  if (q.pageSize !== undefined) out.limit = q.pageSize;
  const search = q.q?.trim();
  if (search) out.search = search;
  if (q.docType) out.docType = q.docType;
  if (q.status) out.status = q.status;
  if (q.issueYear !== undefined) out.issueYear = q.issueYear;
  if (q.departmentId) out.departmentId = q.departmentId;
  return out;
}

export const legalDocumentsService = {
  list: (q: LegalDocumentListQuery = {}): Promise<Paginated<LegalDocument>> =>
    api
      .get<unknown>(endpoints.legalDocuments.list, { params: toLegalDocumentListParams(q) })
      .then((r) =>
        unwrapPage(
          r.data,
          { page: q.page ?? 1, pageSize: q.pageSize ?? DEFAULT_PAGE_SIZE },
          toLegalDocument,
        ),
      ),

  /** Every row matching the filters (CSV export), fetched page by page. */
  async listAll(q: LegalDocumentListQuery = {}): Promise<LegalDocument[]> {
    const all: LegalDocument[] = [];
    for (let page = 1; page <= 100; page += 1) {
      const res = await legalDocumentsService.list({ ...q, page, pageSize: EXPORT_PAGE_SIZE });
      all.push(...res.items);
      if (res.items.length < EXPORT_PAGE_SIZE || all.length >= res.total) break;
    }
    return all;
  },

  get: (id: string): Promise<LegalDocument> =>
    api
      .get<unknown>(endpoints.legalDocuments.detail(id))
      .then((r) => toLegalDocument(unwrap(r.data))),

  create: (body: LegalDocumentPayload): Promise<LegalDocument> =>
    api
      .post<unknown>(endpoints.legalDocuments.list, body)
      .then((r) => toLegalDocument(unwrap(r.data))),

  update: (id: string, body: LegalDocumentPatch): Promise<LegalDocument> =>
    api
      .patch<unknown>(endpoints.legalDocuments.detail(id), body)
      .then((r) => toLegalDocument(unwrap(r.data))),

  remove: (id: string): Promise<void> =>
    api.delete<unknown>(endpoints.legalDocuments.detail(id)).then(() => undefined),

  dashboard: (): Promise<LegalDocumentsDashboard> =>
    api
      .get<unknown>(endpoints.legalDocuments.dashboard)
      .then((r) => toLegalDocumentsDashboard(r.data)),
};
