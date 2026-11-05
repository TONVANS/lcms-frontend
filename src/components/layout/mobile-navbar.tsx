'use client';

import { Bell, FilePlus2, FileText, Home, Menu, Scale, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import type { ModuleKey } from '@/types/domain';

interface MobileNavbarProps {
  moduleKey?: ModuleKey | null;
  unreadCount?: number;
  menuOpen: boolean;
  onMenuClick: () => void;
}

export function MobileNavbar({
  moduleKey,
  unreadCount = 0,
  menuOpen,
  onMenuClick,
}: MobileNavbarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const canCreate =
    user && moduleKey ? hasPermission(user, moduleKey, 'create') : false;

  // Primary module navigation target
  const moduleHref = moduleKey === 'gc' ? '/contracts' : moduleKey === 'legal' ? '/legal' : '/ppa';
  const moduleLabel = moduleKey === 'gc' ? 'GC' : moduleKey === 'legal' ? 'Legal' : 'PPA';
  const ModuleIcon = moduleKey === 'gc' ? FileText : moduleKey === 'legal' ? Scale : Zap;
  const isModuleActive =
    (moduleKey && pathname.startsWith(moduleHref)) ||
    (moduleKey === 'gc' && pathname.startsWith('/contracts'));

  // Create or contracts action
  const createHref =
    moduleKey === 'gc'
      ? '/contracts/new'
      : moduleKey === 'legal'
        ? '/legal/new'
        : '/ppa/new';
  const contractsHref =
    moduleKey === 'gc'
      ? '/contracts/list'
      : moduleKey === 'legal'
        ? '/legal/regulations'
        : '/ppa/contracts';

  const isHomeActive = pathname === '/';
  const isNotificationsActive = pathname.startsWith('/notifications');
  const isContractsActive =
    pathname === contractsHref || (!canCreate && pathname.includes('contracts'));
  const isCreateActive = pathname === createHref;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-white/92 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-all duration-200 md:hidden dark:border-white/10 dark:bg-[#071329]/95 dark:shadow-[0_-8px_25px_rgba(0,0,0,0.4)] print:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-around gap-1">
        {/* 1. Home */}
        <Link
          href="/"
          aria-current={isHomeActive ? 'page' : undefined}
          className={cn(
            'group relative flex min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-center transition-all duration-150',
            isHomeActive
              ? 'text-primary dark:text-[#5cc8ff] font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <div
            className={cn(
              'flex size-8 items-center justify-center rounded-lg transition-transform duration-150 group-active:scale-90',
              isHomeActive && 'bg-primary/10 dark:bg-[#5cc8ff]/15',
            )}
          >
            <Home className="size-5" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">{lo.common.home}</span>
          {isHomeActive ? (
            <span
              aria-hidden="true"
              className="absolute -top-1 size-1 rounded-full bg-primary dark:bg-[#5cc8ff]"
            />
          ) : null}
        </Link>

        {/* 2. Current Module */}
        <Link
          href={moduleHref}
          aria-current={isModuleActive && !isCreateActive ? 'page' : undefined}
          className={cn(
            'group relative flex min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-center transition-all duration-150',
            isModuleActive && !isCreateActive
              ? 'text-primary dark:text-[#5cc8ff] font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <div
            className={cn(
              'flex size-8 items-center justify-center rounded-lg transition-transform duration-150 group-active:scale-90',
              isModuleActive && !isCreateActive && 'bg-primary/10 dark:bg-[#5cc8ff]/15',
            )}
          >
            <ModuleIcon className="size-5" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">{moduleLabel}</span>
          {isModuleActive && !isCreateActive ? (
            <span
              aria-hidden="true"
              className="absolute -top-1 size-1 rounded-full bg-primary dark:bg-[#5cc8ff]"
            />
          ) : null}
        </Link>

        {/* 3. Center Action: Quick Create (+) or Contracts List */}
        {canCreate ? (
          <Link
            href={createHref}
            aria-label={lo.nav.create}
            aria-current={isCreateActive ? 'page' : undefined}
            className="group relative -mt-3 flex min-w-14 flex-1 flex-col items-center justify-center text-center"
          >
            <div
              className={cn(
                'flex size-11 items-center justify-center rounded-full bg-[image:var(--primary-gradient)] text-white shadow-lg shadow-blue-600/30 ring-4 ring-background transition-transform duration-150 group-active:scale-90',
                isCreateActive && 'ring-primary dark:ring-[#d4b37a]',
              )}
            >
              <FilePlus2 className="size-5" />
            </div>
            <span
              className={cn(
                'mt-1 text-[10px] leading-none tracking-tight',
                isCreateActive ? 'font-semibold text-primary dark:text-[#5cc8ff]' : 'text-muted-foreground',
              )}
            >
              {lo.nav.create}
            </span>
          </Link>
        ) : (
          <Link
            href={contractsHref}
            aria-current={isContractsActive ? 'page' : undefined}
            className={cn(
              'group relative flex min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-center transition-all duration-150',
              isContractsActive
                ? 'text-primary dark:text-[#5cc8ff] font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-lg transition-transform duration-150 group-active:scale-90',
                isContractsActive && 'bg-primary/10 dark:bg-[#5cc8ff]/15',
              )}
            >
              <FileText className="size-5" />
            </div>
            <span className="text-[10px] leading-none tracking-tight">{lo.nav.contracts}</span>
            {isContractsActive ? (
              <span
                aria-hidden="true"
                className="absolute -top-1 size-1 rounded-full bg-primary dark:bg-[#5cc8ff]"
              />
            ) : null}
          </Link>
        )}

        {/* 4. Notifications with badge */}
        <Link
          href="/notifications"
          aria-current={isNotificationsActive ? 'page' : undefined}
          className={cn(
            'group relative flex min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-center transition-all duration-150',
            isNotificationsActive
              ? 'text-primary dark:text-[#5cc8ff] font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <div
            className={cn(
              'relative flex size-8 items-center justify-center rounded-lg transition-transform duration-150 group-active:scale-90',
              isNotificationsActive && 'bg-primary/10 dark:bg-[#5cc8ff]/15',
            )}
          >
            <Bell className="size-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 py-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-background">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </div>
          <span className="text-[10px] leading-none tracking-tight">{lo.nav.notifications}</span>
          {isNotificationsActive ? (
            <span
              aria-hidden="true"
              className="absolute -top-1 size-1 rounded-full bg-primary dark:bg-[#5cc8ff]"
            />
          ) : null}
        </Link>

        {/* 5. Menu Drawer Trigger */}
        <button
          type="button"
          aria-label={lo.nav.mainMenu}
          aria-expanded={menuOpen}
          onClick={onMenuClick}
          className={cn(
            'group relative flex min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-center transition-all duration-150',
            menuOpen
              ? 'text-primary dark:text-[#5cc8ff] font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <div
            className={cn(
              'flex size-8 items-center justify-center rounded-lg transition-transform duration-150 group-active:scale-90',
              menuOpen && 'bg-primary/10 dark:bg-[#5cc8ff]/15',
            )}
          >
            <Menu className="size-5" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">{lo.nav.mainMenu}</span>
          {menuOpen ? (
            <span
              aria-hidden="true"
              className="absolute -top-1 size-1 rounded-full bg-primary dark:bg-[#5cc8ff]"
            />
          ) : null}
        </button>
      </div>
    </nav>
  );
}

