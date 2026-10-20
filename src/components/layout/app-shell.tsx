'use client';

import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { getModuleFromPath } from '@/config/navigation';
import { useUiStore } from '@/stores/ui.store';
import { AppSidebar } from './app-sidebar';
import { BackgroundGlows } from './background-glows';
import { Topbar } from './topbar';

interface AppShellProps {
  children: ReactNode;
  unreadCount?: number;
}

export function AppShell({ children, unreadCount = 0 }: AppShellProps) {
  const pathname = usePathname();
  const moduleKey = getModuleFromPath(pathname);
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
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 p-6">
        <Topbar variant="home" unreadCount={unreadCount} />
        <main id="main-content">{children}</main>
      </div>
    </>
  );
}
