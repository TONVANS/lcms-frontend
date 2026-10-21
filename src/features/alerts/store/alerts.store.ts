import { create } from 'zustand';
import { registerLogoutReset } from '@/lib/auth/logout-registry';
import type { Alert } from '@/types/domain';
import { alertsService } from '../api/alerts.service';

interface AlertsState {
  items: Alert[];
  unreadCount: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  fetch(): Promise<void>;
  reset(): void;
}

const initial = (): Pick<AlertsState, 'items' | 'unreadCount' | 'status'> => ({
  items: [],
  unreadCount: 0,
  status: 'idle',
});

// Bumped by reset(); a fetch started in an earlier generation drops its result.
let generation = 0;
// Bumped by every fetch(); only the newest request may write, so a slow older one cannot overwrite it.
let requestSeq = 0;

export const useAlertsStore = create<AlertsState>()((set) => ({
  ...initial(),
  async fetch() {
    const gen = generation;
    const seq = ++requestSeq;
    set({ status: 'loading' });
    try {
      const items = await alertsService.list();
      if (gen !== generation || seq !== requestSeq) return;
      set({ items, unreadCount: items.filter((a) => !a.read).length, status: 'ready' });
    } catch {
      if (gen !== generation || seq !== requestSeq) return;
      set({ status: 'error' });
    }
  },
  reset() {
    generation += 1;
    set({ ...initial(), items: [] });
  },
}));

registerLogoutReset(() => useAlertsStore.getState().reset());
