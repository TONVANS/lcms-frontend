import { create } from 'zustand';
import { isCanceledError, normalizeError } from '@/lib/api/errors';
import { registerLogoutReset } from '@/lib/auth/logout-registry';
import type { ApiError } from '@/types/api';
import { USERS_PAGE_SIZE, usersService } from '../api/users.service';
import type { AdminUser, UserListQuery } from '../types';

interface UsersListState {
  query: UserListQuery;
  items: AdminUser[];
  total: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: ApiError | null;
  /** Patch semantics: any patch without `page` resets page to 1. */
  setQuery(patch: Partial<UserListQuery>): void;
  fetch(): Promise<void>;
  /** Refetch after a delete, stepping back a page when the current one emptied. */
  afterDelete(): Promise<void>;
  reset(): void;
}

const defaults = (): UserListQuery => ({ page: 1, pageSize: USERS_PAGE_SIZE });
const initial = () => ({
  query: defaults(),
  items: [] as AdminUser[],
  total: 0,
  status: 'idle' as const,
  error: null as ApiError | null,
});

// Every fetch and reset bumps it; a response from an older generation is dropped.
let generation = 0;

export const useUsersListStore = create<UsersListState>()((set, get) => ({
  ...initial(),

  setQuery(patch) {
    set((s) => ({ query: { ...s.query, ...patch, page: patch.page ?? 1 } }));
  },

  async fetch() {
    const gen = ++generation;
    set({ status: 'loading', error: null });
    try {
      const res = await usersService.list(get().query);
      if (gen !== generation) return;
      set({ items: res.items, total: res.total, status: 'ready', error: null });
    } catch (e) {
      if (gen !== generation || isCanceledError(e)) return;
      set({ status: 'error', error: normalizeError(e) });
    }
  },

  async afterDelete() {
    await get().fetch();
    const { items, query } = get();
    if (items.length === 0 && (query.page ?? 1) > 1) {
      set({ query: { ...query, page: (query.page ?? 1) - 1 } });
      await get().fetch();
    }
  },

  reset() {
    generation += 1;
    set(initial());
  },
}));

registerLogoutReset(() => useUsersListStore.getState().reset());
