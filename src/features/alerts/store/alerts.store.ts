import { create } from 'zustand';
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

export const useAlertsStore = create<AlertsState>()((set) => ({
  ...initial(),
  async fetch() {
    const gen = generation;
    set({ status: 'loading' });
    try {
      const items = await alertsService.list();
      if (gen !== generation) return;
      set({ items, unreadCount: items.filter((a) => !a.read).length, status: 'ready' });
    } catch {
      if (gen !== generation) return;
      set({ status: 'error' });
    }
  },
  reset() {
    generation += 1;
    set({ ...initial(), items: [] });
  },
}));
