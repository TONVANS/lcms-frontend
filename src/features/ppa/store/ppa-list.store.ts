import { create } from 'zustand';
import { isCanceledError, normalizeError } from '@/lib/api/errors';
import { registerLogoutReset } from '@/lib/auth/logout-registry';
import type { ApiError } from '@/types/api';
import { ppaService } from '../api/ppa.service';
import type { PpaContract, PpaFilterState } from '../types';

interface PpaListState {
  filters: PpaFilterState;
  items: PpaContract[];
  total: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: ApiError | null;
  setFilter<K extends keyof PpaFilterState>(key: K, value: PpaFilterState[K]): void;
  setFilters(partial: Partial<PpaFilterState>): void;
  resetFilters(): void;
  fetch(): Promise<void>;
  reset(): void;
}

const defaultFilters: PpaFilterState = {
  q: '',
  status: 'all',
  energyType: 'all',
  market: 'all',
  page: 1,
  pageSize: 10,
};

let generation = 0;

export const usePpaListStore = create<PpaListState>()((set, get) => ({
  filters: { ...defaultFilters },
  items: [],
  total: 0,
  status: 'idle',
  error: null,

  setFilter(key, value) {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
        // Reset to page 1 if any filter besides page changed
        page: key === 'page' ? (value as number) : 1,
      },
    }));
    get().fetch();
  },

  setFilters(partial) {
    set((state) => ({
      filters: {
        ...state.filters,
        ...partial,
        page: partial.page ?? (partial.q !== undefined || partial.status !== undefined || partial.energyType !== undefined ? 1 : state.filters.page),
      },
    }));
    get().fetch();
  },

  resetFilters() {
    set({ filters: { ...defaultFilters } });
    get().fetch();
  },

  async fetch() {
    const gen = ++generation;
    set({ status: 'loading', error: null });

    try {
      const { filters } = get();
      const res = await ppaService.list({
        q: filters.q || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        page: filters.page,
        pageSize: filters.pageSize,
        sort: filters.sort,
        order: filters.order,
      });

      if (gen !== generation) return;

      // Also filter by energyType & market if service returned unfiltered (in mock mode service handles it)
      let items = res.items;
      if (filters.energyType && filters.energyType !== 'all') {
        items = items.filter((i) => i.energyType === filters.energyType);
      }
      if (filters.market && filters.market !== 'all') {
        items = items.filter((i) => i.market === filters.market);
      }

      set({
        items,
        total: res.total,
        status: 'ready',
        error: null,
      });
    } catch (e) {
      if (gen !== generation) return;
      if (isCanceledError(e)) return;

      set({
        status: 'error',
        error: normalizeError(e),
      });
    }
  },

  reset() {
    generation += 1;
    set({
      filters: { ...defaultFilters },
      items: [],
      total: 0,
      status: 'idle',
      error: null,
    });
  },
}));

registerLogoutReset(() => usePpaListStore.getState().reset());
