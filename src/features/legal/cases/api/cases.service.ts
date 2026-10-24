import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Paginated } from '@/types/api';
import type {
  CaseInput,
  CaseProgressFilter,
  CaseSortKey,
  CaseStage,
  CaseType,
  LegalCase,
} from '../types';

export interface CaseListQuery {
  page?: number;
  pageSize?: number | 'all';
  q?: string;
  caseType?: CaseType;
  stage?: CaseStage;
  progress?: CaseProgressFilter;
  sort?: CaseSortKey;
  order?: 'asc' | 'desc';
}

export const casesService = {
  list: (q?: CaseListQuery): Promise<Paginated<LegalCase>> =>
    api.get<Paginated<LegalCase>>(endpoints.legal.cases, { params: q }).then((r) => r.data),

  get: (id: string): Promise<LegalCase> =>
    api.get<LegalCase>(endpoints.legal.case(id)).then((r) => r.data),

  create: (body: CaseInput): Promise<LegalCase> =>
    api.post<LegalCase>(endpoints.legal.cases, body).then((r) => r.data),

  update: (id: string, body: CaseInput): Promise<LegalCase> =>
    api.patch<LegalCase>(endpoints.legal.case(id), body).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete<void>(endpoints.legal.case(id)).then((r) => r.data),
};
