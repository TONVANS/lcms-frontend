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

export const useAlertsStore = create<AlertsState>()((set) => ({
  ...initial(),
  async fetch() {
    set({ status: 'loading' });
    try {
      const items = await alertsService.list();
      set({ items, unreadCount: items.filter((a) => !a.read).length, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },
  reset() {
    set({ ...initial(), items: [] });
  },
}));
