'use client';

import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { getModuleFromPath } from '@/config/navigation';
import { useAlertsStore } from '@/features/alerts';
import { useAuthStore } from '@/features/auth';
import { canAccessModule } from '@/lib/auth/permissions';
import { useUiStore } from '@/stores/ui.store';
import { AppSidebar } from './app-sidebar';
import { BackgroundGlows } from './background-glows';
import { Topbar } from './topbar';

interface AppShellProps {
  children: ReactNode;
  /** Overrides the alerts store count (tests / stories). */
  unreadCount?: number;
}

export function AppShell({ children, unreadCount: unreadOverride }: AppShellProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const storeUnread = useAlertsStore((s) => s.unreadCount);
  const unreadCount = unreadOverride ?? storeUnread;

  // AuthGate mounts AppShell only while authenticated, so unmount == session end.
  useEffect(() => {
    void useAlertsStore.getState().fetch();
    return () => useAlertsStore.getState().reset();
  }, []);

  const pathModule = getModuleFromPath(pathname);
  // Forbidden modules render the home layout (spec §4); ModuleGuard shows the denial.
  const moduleKey = pathModule && user && canAccessModule(user, pathModule) ? pathModule : null;
  const setLastModule = useUiStore((s) => s.setLastModule);

  useEffect(() => {
    if (moduleKey) setLastModule(moduleKey);
  }, [moduleKey, setLastModule]);

  if (moduleKey) {
    return (
      <>
        <BackgroundGlows accent={moduleKey} />
        <div className="flex flex-wrap gap-6 p-6">
          <AppSidebar module={moduleKey} />
          <div className="flex min-w-0 flex-col gap-6" style={{ flex: '999 1 560px' }}>
            <Topbar variant="module" unreadCount={unreadCount} />
            <main id="main-content">{children}</main>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BackgroundGlows />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 p-6">
        <Topbar variant="home" unreadCount={unreadCount} />
        <main id="main-content">{children}</main>
      </div>
    </>
  );
}
