import { create } from 'zustand';
import { isCanceledError, normalizeError } from '@/lib/api/errors';
import { registerLogoutReset } from '@/lib/auth/logout-registry';
import type { ApiError } from '@/types/api';
import { gcService, type GcListQuery } from '../api/gc.service';
import type { GeneralContract } from '../types';
import { DEFAULT_GC_QUERY } from './gc-list-query';

interface GcListState {
  query: GcListQuery;
  items: GeneralContract[];
  total: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: ApiError | null;
  /** Patch semantics: any patch without `page` resets page to 1. */
  setQuery(patch: Partial<GcListQuery>): void;
  /** Replace semantics: the whole query becomes DEFAULT_GC_QUERY plus `q`. */
  replaceQuery(q: GcListQuery): void;
  fetch(): Promise<void>;
  afterDelete(): Promise<void>;
  reset(): void;
}

const initial = (): Pick<GcListState, 'query' | 'items' | 'total' | 'status' | 'error'> => ({
  query: { ...DEFAULT_GC_QUERY },
  items: [],
  total: 0,
  status: 'idle',
  error: null,
});

// Every fetch and reset bumps it; a response from an older generation is dropped.
let generation = 0;

export const useGcListStore = create<GcListState>()((set, get) => ({
  ...initial(),

  setQuery(patch) {
    set((s) => ({ query: { ...s.query, ...patch, page: patch.page ?? 1 } }));
  },

  replaceQuery(q) {
    set({ query: { ...DEFAULT_GC_QUERY, ...q } });
  },

  async fetch() {
    const gen = ++generation;
    const prev = { status: get().status, error: get().error };
    set({ status: 'loading', error: null });
    try {
      const res = await gcService.list(get().query);
      if (gen !== generation) return;
      set({ items: res.items, total: res.total, status: 'ready', error: null });
    } catch (e) {
      if (gen !== generation) return;
      if (isCanceledError(e)) {
        // Restore what was showing before; a superseded 'loading' falls back to what the data implies.
        const status =
          prev.status === 'loading' ? (get().items.length > 0 ? 'ready' : 'idle') : prev.status;
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

registerLogoutReset(() => useGcListStore.getState().reset());
