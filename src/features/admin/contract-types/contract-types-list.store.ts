import {
  createListStore,
  createQueryCodec,
  useListUrlSync,
  DEFAULT_PAGE_SIZES,
  type ListQueryBase,
} from '@/lib/list';
import { adminService } from '../admin.service';
import { activeFilterToBool, type ActiveFilter } from '../shared/admin-list-toolbar';
import type { ContractType } from '../types';

export interface ContractTypesQuery extends ListQueryBase {
  page?: number;
  pageSize?: number;
  q?: string;
  filter?: ActiveFilter;
}

export const CONTRACT_TYPES_PAGE_SIZES = DEFAULT_PAGE_SIZES;

export const contractTypesQueryCodec = createQueryCodec<ContractTypesQuery>({
  defaults: { page: 1, pageSize: 20 },
  enums: { filter: ['all', 'active', 'inactive'] as const },
  pageSizes: CONTRACT_TYPES_PAGE_SIZES,
});

export const useContractTypesListStore = createListStore<ContractType, ContractTypesQuery>(
  async (q) => {
    const all = await adminService.contractTypes.list({
      search: q.q,
      isActive: activeFilterToBool(q.filter ?? 'all'),
    });
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const items = all.slice((page - 1) * pageSize, page * pageSize);
    return {
      items,
      total: all.length,
      page,
      pageSize,
    };
  },
  contractTypesQueryCodec.defaults,
);

export function useContractTypesListUrlSync(): void {
  useListUrlSync(useContractTypesListStore, contractTypesQueryCodec);
}

