import {
  createListStore,
  createQueryCodec,
  useListUrlSync,
  DEFAULT_PAGE_SIZES,
} from '@/lib/list';
import { USERS_PAGE_SIZE, usersService } from '../api/users.service';
import { USER_ROLES, type AdminUser, type UserListQuery } from '../types';

export const USERS_PAGE_SIZES = DEFAULT_PAGE_SIZES;

export const usersQueryCodec = createQueryCodec<UserListQuery>({
  defaults: { page: 1, pageSize: USERS_PAGE_SIZE },
  enums: { role: USER_ROLES },
  booleans: ['isActive'],
  pageSizes: USERS_PAGE_SIZES,
});

export const useUsersListStore = createListStore<AdminUser, UserListQuery>(
  (q) => usersService.list(q),
  usersQueryCodec.defaults,
);

export function useUsersListUrlSync(): void {
  useListUrlSync(useUsersListStore, usersQueryCodec);
}
