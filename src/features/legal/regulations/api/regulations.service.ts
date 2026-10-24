import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Paginated } from '@/types/api';
import type { LegalUnit } from '../../constants';
import type { RegulationInput } from '../schemas/regulation.schema';
import type { Regulation, RegulationSortKey, RegulationStatus, RegulationType } from '../types';

export interface RegulationListQuery {
  page?: number;
  pageSize?: number | 'all';
  q?: string;
  type?: RegulationType;
  unit?: LegalUnit;
  status?: RegulationStatus;
  sort?: RegulationSortKey;
  order?: 'asc' | 'desc';
}

export const regulationsService = {
  list: (q?: RegulationListQuery): Promise<Paginated<Regulation>> =>
    api
      .get<Paginated<Regulation>>(endpoints.legal.regulations, { params: q })
      .then((r) => r.data),

  get: (id: string): Promise<Regulation> =>
    api.get<Regulation>(endpoints.legal.regulation(id)).then((r) => r.data),

  create: (body: RegulationInput): Promise<Regulation> =>
    api.post<Regulation>(endpoints.legal.regulations, body).then((r) => r.data),

  update: (id: string, body: RegulationInput): Promise<Regulation> =>
    api.patch<Regulation>(endpoints.legal.regulation(id), body).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete<void>(endpoints.legal.regulation(id)).then((r) => r.data),
};
