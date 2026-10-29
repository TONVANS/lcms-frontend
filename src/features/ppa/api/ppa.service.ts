import { api } from '@/lib/api/client';
import { unwrap, unwrapPage } from '@/lib/api/envelope';
import { endpoints } from '@/lib/api/endpoints';
import type { Paginated } from '@/types/api';
import { toPowerContract, toPowerContractsDashboard } from '../lib/power-contract-mapper';
import type { PowerContractPayload } from '../schemas/ppa.schema';
import type { PowerContract, PowerContractsDashboard, PowerListQuery } from '../types';

export type { PowerListQuery, PowerContractsDashboard };

interface ReqOpts {
  signal?: AbortSignal;
}

/** Store names -> backend names (`q -> search`, `pageSize -> limit`); empty values are omitted. */
export function toListParams(q: PowerListQuery = {}): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (q.page !== undefined) out.page = q.page;
  if (q.pageSize !== undefined) out.limit = q.pageSize;
  const search = q.q?.trim();
  if (search) out.search = search;
  if (q.contractType) out.contractType = q.contractType;
  if (q.status) out.status = q.status;
  const pt = q.projectTypeOrCustomer?.trim();
  if (pt) out.projectTypeOrCustomer = pt;
  return out;
}

export const ppaService = {
  list: (q: PowerListQuery = {}, opts: ReqOpts = {}): Promise<Paginated<PowerContract>> =>
    api
      .get<unknown>(endpoints.powerContracts.list, { params: toListParams(q), signal: opts.signal })
      .then((r) => unwrapPage(r.data, { page: q.page ?? 1, pageSize: q.pageSize ?? 10 }, toPowerContract)),

  get: (id: string): Promise<PowerContract> =>
    api.get<unknown>(endpoints.powerContracts.detail(id)).then((r) => toPowerContract(unwrap(r.data))),

  create: (body: PowerContractPayload): Promise<PowerContract> =>
    api
      .post<unknown>(endpoints.powerContracts.list, body)
      .then((r) => toPowerContract(unwrap(r.data))),

  update: (id: string, body: PowerContractPayload): Promise<PowerContract> =>
    api
      .patch<unknown>(endpoints.powerContracts.detail(id), body)
      .then((r) => toPowerContract(unwrap(r.data))),

  remove: (id: string): Promise<void> =>
    api.delete<unknown>(endpoints.powerContracts.detail(id)).then(() => undefined),

  dashboard: (): Promise<PowerContractsDashboard> =>
    api
      .get<unknown>(endpoints.powerContracts.dashboard)
      .then((r) => toPowerContractsDashboard(unwrap(r.data))),
};
