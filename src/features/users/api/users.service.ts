import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { unwrap, unwrapPage } from '@/lib/api/envelope';
import type { Paginated } from '@/types/api';
import { toAdminUser, toHrmEmployee } from '../lib/user-mapper';
import type {
  AdminUser,
  HrmEmployee,
  UserCreatePayload,
  UserListQuery,
  UserUpdatePayload,
} from '../types';

export const USERS_PAGE_SIZE = 10;

/** Store query -> backend query params. Empty values are omitted. */
export function toUserListParams(q: UserListQuery = {}): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (q.page !== undefined) out.page = q.page;
  if (q.pageSize !== undefined) out.limit = q.pageSize;
  const search = q.q?.trim();
  if (search) out.search = search;
  if (q.role) out.role = q.role;
  if (q.isActive !== undefined) out.isActive = q.isActive;
  return out;
}

export const usersService = {
  list: (q: UserListQuery = {}): Promise<Paginated<AdminUser>> =>
    api
      .get<unknown>(endpoints.users.list, { params: toUserListParams(q) })
      .then((r) =>
        unwrapPage(r.data, { page: q.page ?? 1, pageSize: q.pageSize ?? USERS_PAGE_SIZE }, toAdminUser),
      ),

  get: (id: string): Promise<AdminUser> =>
    api.get<unknown>(endpoints.users.detail(id)).then((r) => toAdminUser(unwrap(r.data))),

  create: (dto: UserCreatePayload): Promise<AdminUser> =>
    api.post<unknown>(endpoints.users.list, dto).then((r) => toAdminUser(unwrap(r.data))),

  update: (id: string, dto: UserUpdatePayload): Promise<AdminUser> =>
    api.patch<unknown>(endpoints.users.detail(id), dto).then((r) => toAdminUser(unwrap(r.data))),

  remove: (id: string): Promise<void> =>
    api.delete<unknown>(endpoints.users.detail(id)).then(() => undefined),

  hrmLookup: (empCode: string): Promise<HrmEmployee> =>
    api
      .get<unknown>(endpoints.users.hrm(empCode))
      .then((r) => toHrmEmployee(unwrap(r.data), empCode)),
};
