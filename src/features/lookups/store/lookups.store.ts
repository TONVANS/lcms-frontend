import { create } from 'zustand';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { registerLogoutReset } from '@/lib/auth/logout-registry';
import { lo } from '@/lib/i18n/lo';
import type { ContractTypeOption, Department } from '@/types/domain';
import { lookupsService } from '../api/lookups.service';
import type { LookupKey, LookupStatus } from '../types';

interface Entry<T> {
  items: T[];
  status: LookupStatus;
  error: string | null;
}

interface LookupsState {
  departments: Entry<Department>;
  contractTypes: Entry<ContractTypeOption>;
  projectTypes: Entry<string>;
  /** Loads a lookup once; a ready or in-flight key is a no-op unless `force`. */
  load(key: LookupKey, force?: boolean): Promise<void>;
  reset(): void;
}

const empty = <T>(): Entry<T> => ({ items: [], status: 'idle', error: null });

const initial = () => ({
  departments: empty<Department>(),
  contractTypes: empty<ContractTypeOption>(),
  projectTypes: empty<string>(),
});

// Bumped by reset(); a request started in an earlier generation drops its result.
let generation = 0;
const inflight = new Map<LookupKey, Promise<void>>();

const fetchers: Record<LookupKey, () => Promise<unknown[]>> = {
  departments: () => lookupsService.departments(),
  contractTypes: () => lookupsService.contractTypes(),
  projectTypes: () => lookupsService.projectTypes(),
};

export const useLookupsStore = create<LookupsState>()((set, get) => ({
  ...initial(),
  load(key, force = false) {
    const pending = inflight.get(key);
    if (pending) return pending;
    if (!force && get()[key].status === 'ready') return Promise.resolve();

    const gen = generation;
    set({ [key]: { ...get()[key], status: 'loading', error: null } } as Partial<LookupsState>);
    const run = fetchers[key]()
      .then((items) => {
        if (gen !== generation) return;
        set({ [key]: { items, status: 'ready', error: null } } as Partial<LookupsState>);
      })
      .catch((err: unknown) => {
        if (gen !== generation) return;
        const error = toUserMessage(normalizeError(err)) || lo.errors.unknown;
        set({ [key]: { items: get()[key].items, status: 'error', error } } as Partial<LookupsState>);
      })
      .finally(() => {
        if (inflight.get(key) === run) inflight.delete(key);
      });
    inflight.set(key, run);
    return run;
  },
  reset() {
    generation += 1;
    inflight.clear();
    set(initial());
  },
}));

registerLogoutReset(() => useLookupsStore.getState().reset());
