import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ListQuery, Paginated } from '@/types/api';
import type { GcContractType, GcStatus, GeneralContract } from '../types';
import type { GcContractInput } from '../schemas/gc.schema';

export interface GcListQuery extends ListQuery {
  type?: GcContractType;
  status?: GcStatus;
  sort?: 'endDate' | 'signedDate' | 'title';
  order?: 'asc' | 'desc';
}

export interface GcDashboard {
  total: number;
  byStatus: Record<GcStatus, number>;
  byType: { type: GcContractType; count: number }[];
  valueTotals: { currency: 'LAK' | 'USD' | 'CNY'; amount: number; count: number }[];
  upcoming: GeneralContract[];
}

export const gcService = {
  list: (q?: GcListQuery): Promise<Paginated<GeneralContract>> =>
    api.get<Paginated<GeneralContract>>(endpoints.gc.list, { params: q }).then((r) => r.data),

  get: (id: string): Promise<GeneralContract> =>
    api.get<GeneralContract>(endpoints.gc.detail(id)).then((r) => r.data),

  create: (body: GcContractInput): Promise<GeneralContract> =>
    api.post<GeneralContract>(endpoints.gc.list, body).then((r) => r.data),

  update: (id: string, body: GcContractInput): Promise<GeneralContract> =>
    api.patch<GeneralContract>(endpoints.gc.detail(id), body).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete<void>(endpoints.gc.detail(id)).then((r) => r.data),

  dashboard: (): Promise<GcDashboard> =>
    api.get<GcDashboard>(endpoints.gc.dashboard).then((r) => r.data),
};
