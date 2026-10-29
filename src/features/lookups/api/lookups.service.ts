import { api } from '@/lib/api/client';
import { unwrap } from '@/lib/api/envelope';
import { endpoints } from '@/lib/api/endpoints';
import type { ContractTypeOption, Department } from '@/types/domain';
import { toContractTypeOption, toDepartment, toProjectType } from '../lib/lookups-mapper';

function list(body: unknown): unknown[] {
  const data = unwrap<unknown>(body);
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null) {
    const inner = (data as { items?: unknown }).items;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

function compact<T>(items: (T | null)[]): T[] {
  return items.filter((i): i is T => i !== null);
}

export const lookupsService = {
  departments: (): Promise<Department[]> =>
    api.get(endpoints.departments.dropdown).then((r) => compact(list(r.data).map(toDepartment))),

  contractTypes: (): Promise<ContractTypeOption[]> =>
    api
      .get(endpoints.contractTypes.dropdown)
      .then((r) => compact(list(r.data).map(toContractTypeOption))),

  projectTypes: (): Promise<string[]> =>
    api
      .get(endpoints.powerContracts.projectTypes)
      .then((r) => compact(list(r.data).map(toProjectType))),
};
