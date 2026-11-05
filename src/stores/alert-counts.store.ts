import { create } from 'zustand';
import { gcService } from '@/features/gc';
import { ppaService } from '@/features/ppa';
import { canAccessModule } from '@/lib/auth/permissions';
import type { User } from '@/types/domain';

interface AlertCountsState {
  ppaExpiringCount: number;
  gcExpiringCount: number;
  loading: boolean;
  fetch: (user: User) => Promise<void>;
  reset: () => void;
}

export const useAlertCountsStore = create<AlertCountsState>()((set) => ({
  ppaExpiringCount: 0,
  gcExpiringCount: 0,
  loading: false,

  fetch: async (user: User) => {
    const canPpa = canAccessModule(user, 'ppa');
    const canGc = canAccessModule(user, 'gc');
    if (!canPpa && !canGc) {
      set({ ppaExpiringCount: 0, gcExpiringCount: 0, loading: false });
      return;
    }

    set({ loading: true });

    try {
      const [ppaRes, gcRes] = await Promise.allSettled([
        canPpa
          ? ppaService.list({ status: 'EXPIRING_SOON', page: 1, pageSize: 1 })
          : Promise.resolve(null),
        canGc
          ? gcService.list({ status: 'EXPIRING_SOON', page: 1, pageSize: 1 })
          : Promise.resolve(null),
      ]);

      const ppaExpiringCount =
        ppaRes.status === 'fulfilled' && ppaRes.value ? ppaRes.value.total : 0;
      const gcExpiringCount =
        gcRes.status === 'fulfilled' && gcRes.value ? gcRes.value.total : 0;

      set({
        ppaExpiringCount,
        gcExpiringCount,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  reset: () => {
    set({ ppaExpiringCount: 0, gcExpiringCount: 0, loading: false });
  },
}));

