import { create } from 'zustand';
import { isCanceledError, normalizeError } from '@/lib/api/errors';
import { registerLogoutReset } from '@/lib/auth/logout-registry';
import type { ApiError } from '@/types/api';
import { ppaService } from '../api/ppa.service';
import type { PowerContract, PowerListQuery } from '../types';
import { DEFAULT_POWER_QUERY } from './ppa-list-query';

interface PpaListState {
  query: PowerListQuery;
  items: PowerContract[];
  total: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: ApiError | null;
  /** Patch semantics: any patch without `page` resets page to 1. */
  setQuery(patch: Partial<PowerListQuery>): void;
  /** Replace semantics: the whole query becomes the defaults plus `q`. */
  replaceQuery(q: PowerListQuery): void;
  fetch(): Promise<void>;
  afterDelete(): Promise<void>;
  reset(): void;
}

const initial = (): Pick<PpaListState, 'query' | 'items' | 'total' | 'status' | 'error'> => ({
  query: { ...DEFAULT_POWER_QUERY },
  items: [],
  total: 0,
  status: 'idle',
  error: null,
});

// Every fetch and reset bumps it; a response from an older generation is dropped.
let generation = 0;

export const usePpaListStore = create<PpaListState>()((set, get) => ({
  ...initial(),

  setQuery(patch) {
    set((s) => ({ query: { ...s.query, ...patch, page: patch.page ?? 1 } }));
  },

  replaceQuery(q) {
    set({ query: { ...DEFAULT_POWER_QUERY, ...q } });
  },

  async fetch() {
    const gen = ++generation;
    const prev = { status: get().status, error: get().error };
    set({ status: 'loading', error: null });
    try {
      const res = await ppaService.list(get().query);
      if (gen !== generation) return;
      set({ items: res.items, total: res.total, status: 'ready', error: null });
    } catch (e) {
      if (gen !== generation) return;
      if (isCanceledError(e)) {
        const status = prev.status === 'loading' ? (get().items.length > 0 ? 'ready' : 'idle') : prev.status;
        set({ status, error: prev.error });
        return;
      }
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

registerLogoutReset(() => usePpaListStore.getState().reset());
