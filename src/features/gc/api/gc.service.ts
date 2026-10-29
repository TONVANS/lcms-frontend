import { api } from '@/lib/api/client';
import { unwrap, unwrapPage } from '@/lib/api/envelope';
import { endpoints } from '@/lib/api/endpoints';
import type { Paginated } from '@/types/api';
import type { ContractStatus } from '@/types/domain';
import { toContract, type ContractPayload } from '../lib/contract-mapper';
import { toContractsDashboard } from '../lib/dashboard-mapper';
import type { Contract, ContractsDashboard } from '../types';

/** Store-side query; mapped to backend names here (plan Ruling 8). No sort. */
export interface GcListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: ContractStatus;
  contractTypeId?: number;
}

export const gcService = {
  list: (q: GcListQuery = {}): Promise<Paginated<Contract>> => {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const params: Record<string, string | number> = { page, limit: pageSize };
    const search = q.q?.trim();
    if (search) params.search = search;
    if (q.status) params.status = q.status;
    if (q.contractTypeId !== undefined) params.contractTypeId = q.contractTypeId;
    return api
      .get(endpoints.contracts.list, { params })
      .then((r) => unwrapPage(r.data, { page, pageSize }, toContract));
  },

  get: (id: string): Promise<Contract> =>
    api.get(endpoints.contracts.detail(id)).then((r) => toContract(unwrap<unknown>(r.data))),

  create: (body: ContractPayload): Promise<Contract> =>
    api.post(endpoints.contracts.list, body).then((r) => toContract(unwrap<unknown>(r.data))),

  update: (id: string, patch: ContractPayload): Promise<Contract> =>
    api
      .patch(endpoints.contracts.detail(id), patch)
      .then((r) => toContract(unwrap<unknown>(r.data))),

  remove: (id: string): Promise<void> =>
    api.delete(endpoints.contracts.detail(id)).then(() => undefined),

  dashboard: (): Promise<ContractsDashboard> =>
    api.get(endpoints.contracts.dashboard).then((r) => toContractsDashboard(r.data)),
};
