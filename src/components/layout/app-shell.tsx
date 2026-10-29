'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getModuleFromPath } from '@/config/navigation';
import { useAuthStore } from '@/features/auth';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useNotificationsStore } from '@/features/notifications';
import { canAccessModule } from '@/lib/auth/permissions';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/stores/ui.store';
import { AppSidebar } from './app-sidebar';
import { BackgroundGlows } from './background-glows';
import { Topbar } from './topbar';

interface AppShellProps {
  children: ReactNode;
}

const MOBILE_NAV_ID = 'mobile-sidebar';

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile sheet on navigation (state adjusted during render).
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMobileOpen(false);
  }

  // AuthGate mounts AppShell only while authenticated, so unmount == session end.
  useEffect(() => {
    if (user) void useNotificationsStore.getState().fetch(user);
  }, [user]);

  useEffect(() => () => useNotificationsStore.getState().reset(), []);

  const pathModule = getModuleFromPath(pathname);
  // Forbidden modules render the home layout (spec §4); ModuleGuard shows the denial.
  const moduleKey = pathModule && user && canAccessModule(user, pathModule) ? pathModule : null;
  const setLastModule = useUiStore((s) => s.setLastModule);

  useEffect(() => {
    if (moduleKey) setLastModule(moduleKey);
  }, [moduleKey, setLastModule]);

  const isForbidden = pathModule !== null && user !== null && !canAccessModule(user, pathModule);
  // Every authenticated user gets the sidebar, except on forbidden module pages.
  const showSidebar = user !== null && !isForbidden;

  return (
    <>
      <BackgroundGlows accent={moduleKey ?? undefined} />
      <div
        className={cn(
          'p-6 transition-all',
          showSidebar
            ? 'flex flex-col gap-6 md:flex-row md:flex-wrap'
            : 'mx-auto flex w-full max-w-[1280px] flex-col gap-6',
        )}
      >
        {showSidebar ? (
          <div className="hidden shrink-0 md:flex print:hidden" style={{ flex: '1 1 248px' }}>
            <AppSidebar module={moduleKey ?? undefined} className="w-full" />
          </div>
        ) : null}
        <div
          className="flex min-w-0 flex-col gap-6"
          style={showSidebar ? { flex: '999 1 560px' } : undefined}
        >
          <div className="print:hidden">
            <Topbar
              variant={moduleKey ? 'module' : 'home'}
              menuOpen={mobileOpen}
              menuControlsId={showSidebar ? MOBILE_NAV_ID : undefined}
              onMenuClick={showSidebar ? () => setMobileOpen((o) => !o) : undefined}
            />
          </div>
          <main id="main-content">{children}</main>
        </div>
      </div>
      {showSidebar ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            id={MOBILE_NAV_ID}
            side="left"
            showCloseButton={false}
            className="w-[min(20rem,calc(100vw-2rem))] max-w-none border-0 bg-transparent p-2 sm:max-w-none print:hidden"
          >
            <SheetTitle className="sr-only">{lo.nav.mainMenu}</SheetTitle>
            <SheetDescription className="sr-only">{lo.nav.mainMenu}</SheetDescription>
            <AppSidebar module={moduleKey ?? undefined} className="h-full overflow-y-auto" />
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
