import {
  createListStore,
  createQueryCodec,
  useListUrlSync,
  DEFAULT_PAGE_SIZES,
  type ListQueryBase,
} from '@/lib/list';
import { adminService } from '../admin.service';
import { activeFilterToBool, type ActiveFilter } from '../shared/admin-list-toolbar';
import type { DepartmentRecord } from '../types';

export interface DepartmentsQuery extends ListQueryBase {
  page?: number;
  pageSize?: number;
  q?: string;
  filter?: ActiveFilter;
}

export const DEPARTMENTS_PAGE_SIZES = DEFAULT_PAGE_SIZES;

export const departmentsQueryCodec = createQueryCodec<DepartmentsQuery>({
  defaults: { page: 1, pageSize: 20 },
  enums: { filter: ['all', 'active', 'inactive'] as const },
  pageSizes: DEPARTMENTS_PAGE_SIZES,
});

export const useDepartmentsListStore = createListStore<DepartmentRecord, DepartmentsQuery>(
  async (q) => {
    const all = await adminService.departments.list({
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
  departmentsQueryCodec.defaults,
);

export function useDepartmentsListUrlSync(): void {
  useListUrlSync(useDepartmentsListStore, departmentsQueryCodec);
}

