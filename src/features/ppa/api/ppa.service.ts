import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ListQuery, Paginated } from '@/types/api';
import type { KeyEvent, PpaContract, PpaContractInput, PpaDashboardSummary } from '../types';

export const ppaService = {
  list: (q?: ListQuery): Promise<Paginated<PpaContract>> =>
    api.get<Paginated<PpaContract>>(endpoints.ppa.list, { params: q }).then((r) => r.data),

  get: (id: string): Promise<PpaContract> =>
    api.get<PpaContract>(endpoints.ppa.detail(id)).then((r) => r.data),

  create: (body: PpaContractInput): Promise<PpaContract> =>
    api.post<PpaContract>(endpoints.ppa.list, body).then((r) => r.data),

  update: (id: string, body: Partial<PpaContractInput>): Promise<PpaContract> =>
    api.patch<PpaContract>(endpoints.ppa.detail(id), body).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete<void>(endpoints.ppa.detail(id)).then((r) => r.data),

  dashboard: (): Promise<PpaDashboardSummary> =>
    api.get<PpaDashboardSummary>(endpoints.ppa.dashboard).then((r) => r.data),

  history: (id: string): Promise<KeyEvent[]> =>
    api.get<KeyEvent[]>(endpoints.ppa.history(id)).then((r) => r.data),
};
