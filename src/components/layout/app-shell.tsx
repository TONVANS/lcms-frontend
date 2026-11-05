'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { getModuleFromPath } from '@/config/navigation';
import { useAuthStore } from '@/features/auth';
import { useNotificationsStore } from '@/features/notifications';
import { useAlertCountsStore } from '@/stores/alert-counts.store';
import { canAccessModule } from '@/lib/auth/permissions';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/stores/ui.store';
import { AppSidebar } from './app-sidebar';
import { BackgroundGlows } from './background-glows';
import { MobileNavbar } from './mobile-navbar';
import { Topbar } from './topbar';

interface AppShellProps {
  children: ReactNode;
}

const MOBILE_NAV_ID = 'mobile-sidebar';

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile sheet on navigation (state adjusted during render).
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMobileOpen(false);
  }

  // AuthGate mounts AppShell only while authenticated, so unmount == session end.
  useEffect(() => {
    if (user) {
      void useNotificationsStore.getState().fetch(user);
      void useAlertCountsStore.getState().fetch(user);
    }
  }, [user]);

  useEffect(() => () => {
    useNotificationsStore.getState().reset();
    useAlertCountsStore.getState().reset();
  }, []);

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
          'mx-auto w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 transition-all',
          showSidebar
            ? 'flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6 max-w-[1720px]'
            : 'flex flex-col gap-4 md:gap-6 max-w-[1280px]',
        )}
      >
        {/* Desktop Sticky Sidebar Container */}
        {showSidebar ? (
          <aside className="hidden md:block shrink-0 w-64 lg:w-72 xl:w-80 print:hidden">
            <div className="sticky top-2.5 sm:top-3 md:top-4 h-[calc(100dvh-1.5rem)] sm:h-[calc(100dvh-2rem)]">
              <AppSidebar module={moduleKey ?? undefined} className="h-full" />
            </div>
          </aside>
        ) : null}

        {/* Main Content Area with Sticky Topbar */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4 md:gap-6">
          {/* Sticky Topbar Wrapper: pinned to top of screen so it sticks on scroll */}
          <div className="sticky top-0 z-30 -mt-2.5 pt-2.5 sm:-mt-3 sm:pt-3 md:-mt-4 md:pt-4 pb-1 print:hidden">
            <Topbar
              variant={moduleKey ? 'module' : 'home'}
              moduleKey={moduleKey}
              menuOpen={mobileOpen}
              menuControlsId={showSidebar ? MOBILE_NAV_ID : undefined}
              onMenuClick={showSidebar ? () => setMobileOpen((o) => !o) : undefined}
            />
          </div>
          <main id="main-content" className="min-w-0 flex-1 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Sticky Bottom Navbar */}
      {showSidebar ? (
        <MobileNavbar
          moduleKey={moduleKey}
          unreadCount={unreadCount}
          menuOpen={mobileOpen}
          onMenuClick={() => setMobileOpen((o) => !o)}
        />
      ) : null}

      {/* Mobile Sidebar Sheet Drawer */}
      {showSidebar ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            id={MOBILE_NAV_ID}
            side="left"
            showCloseButton={false}
            className="w-[min(21rem,calc(100vw-2.5rem))] max-w-none border-0 bg-transparent p-2 sm:max-w-none print:hidden"
          >
            <SheetTitle className="sr-only">{lo.nav.mainMenu}</SheetTitle>
            <SheetDescription className="sr-only">{lo.nav.mainMenu}</SheetDescription>
            <AppSidebar
              module={moduleKey ?? undefined}
              className="h-full overflow-hidden shadow-2xl"
              onClose={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
