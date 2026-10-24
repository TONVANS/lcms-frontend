import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { isCanceledError, normalizeError } from '@/lib/api/errors';
import { registerLogoutReset } from '@/lib/auth/logout-registry';
import type { ApiError, Paginated } from '@/types/api';
import type { ListQueryBase } from './list-query-codec';

export interface ListState<T, Q extends ListQueryBase> {
  query: Q;
  items: T[];
  total: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: ApiError | null;
  /** Patch semantics: any patch without `page` resets page to 1. */
  setQuery(patch: Partial<Q>): void;
  /** Replace semantics: the whole query becomes the defaults plus `q`. */
  replaceQuery(q: Q): void;
  fetch(): Promise<void>;
  afterDelete(): Promise<void>;
  reset(): void;
}

export function createListStore<T, Q extends ListQueryBase>(
  fetchPage: (q: Q) => Promise<Paginated<T>>,
  defaults: Q,
): UseBoundStore<StoreApi<ListState<T, Q>>> {
  const initial = (): Pick<ListState<T, Q>, 'query' | 'items' | 'total' | 'status' | 'error'> => ({
    query: { ...defaults },
    items: [],
    total: 0,
    status: 'idle',
    error: null,
  });

  // Every fetch and reset bumps it; a response from an older generation is dropped.
  let generation = 0;

  const useStore = create<ListState<T, Q>>()((set, get) => ({
    ...initial(),

    setQuery(patch) {
      set((s) => ({ query: { ...s.query, ...patch, page: patch.page ?? 1 } }));
    },

    replaceQuery(q) {
      set({ query: { ...defaults, ...q } });
    },

    async fetch() {
      const gen = ++generation;
      const prev = { status: get().status, error: get().error };
      set({ status: 'loading', error: null });
      try {
        const res = await fetchPage(get().query);
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

  registerLogoutReset(() => useStore.getState().reset());
  return useStore;
}
