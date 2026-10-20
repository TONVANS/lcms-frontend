import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ModuleKey } from '@/types/domain';

export type TableDensity = 'comfortable' | 'compact';

interface UiState {
  sidebarCollapsed: boolean;
  lastModule: ModuleKey | null;
  tableDensity: TableDensity;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLastModule: (module: ModuleKey | null) => void;
  setTableDensity: (density: TableDensity) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      lastModule: null,
      tableDensity: 'comfortable',
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setLastModule: (lastModule) => set({ lastModule }),
      setTableDensity: (tableDensity) => set({ tableDensity }),
    }),
    {
      name: 'lcms-ui',
      // Resolved lazily; createJSONStorage returns undefined storage when localStorage is missing (SSR).
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        lastModule: s.lastModule,
        tableDensity: s.tableDensity,
      }),
    },
  ),
);

/**
 * Rehydrates the store on the client if skipHydration is true.
 */
if (typeof window !== 'undefined') {
  useUiStore.persist.rehydrate();
}
