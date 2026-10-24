'use client';

import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { getModuleFromPath } from '@/config/navigation';
import { useAlertsStore } from '@/features/alerts';
import { useAuthStore } from '@/features/auth';
import { canAccessModule } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils/cn';
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

  const isAdmin = user?.role === 'admin';
  const isForbidden = pathModule !== null && user !== null && !canAccessModule(user, pathModule);

  // Show sidebar for admin everywhere except forbidden pages, and for accessible module pages
  const showSidebar = !isForbidden && (isAdmin || moduleKey !== null);

  return (
    <>
      <BackgroundGlows accent={moduleKey ?? undefined} />
      <div
        className={cn(
          'p-6 transition-all',
          showSidebar
            ? 'flex flex-wrap gap-6'
            : 'mx-auto flex w-full max-w-[1280px] flex-col gap-6',
        )}
      >
        {showSidebar ? <AppSidebar module={moduleKey ?? undefined} /> : null}
        <div
          className="flex min-w-0 flex-col gap-6"
          style={showSidebar ? { flex: '999 1 560px' } : undefined}
        >
          <Topbar variant={moduleKey ? 'module' : 'home'} unreadCount={unreadCount} />
          <main id="main-content">{children}</main>
        </div>
      </div>
    </>
  );
}
