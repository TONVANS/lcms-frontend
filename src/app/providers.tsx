'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect, type ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { useUiStore } from '@/stores/ui.store';

/** Rehydrates the persisted UI store after React hydration (store uses skipHydration). */
export function UiStoreHydrator(): null {
  useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <UiStoreHydrator />
      {children}
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
