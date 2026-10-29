'use client';

import { useState } from 'react';
import { ChevronDown, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ADMIN_NAV,
  COMMON_NAV,
  MODULE_NAV,
  getModuleFromPath,
  isNavItemActive,
  type NavItem,
} from '@/config/navigation';
import { useAuthStore } from '@/features/auth';
import { useNotificationsStore } from '@/features/notifications';
import {
  getAccessibleModules,
  hasPermission,
  hasSystemModule,
  isAdmin as isAdminUser,
} from '@/lib/auth/permissions';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import type { ModuleKey, User } from '@/types/domain';

const ITEM_BASE =
  'relative flex min-h-11 items-center gap-3 rounded-[14px] border border-transparent px-3 py-2 text-sm text-[#c9d5ea] transition-colors duration-150 hover:bg-white/10 hover:text-white';
const ITEM_ACTIVE =
  'border-[rgba(96,165,250,0.4)] bg-[linear-gradient(90deg,rgba(37,99,235,0.45),rgba(37,99,235,0.1))] font-semibold text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-[#d4b37a]';

const ACCENT: Record<ModuleKey, string> = {
  ppa: '#5cc8ff',
  gc: '#8b9cff',
  legal: '#d4b37a',
};

const CANONICAL_ORDER: ModuleKey[] = ['ppa', 'gc', 'legal'];

/** Items the user may see: gated by backend system module and by per-module permission. */
function visibleItems(items: NavItem[], k: ModuleKey, user: User): NavItem[] {
  return items.filter(
    (i) =>
      (!i.systemModule || hasSystemModule(user, i.systemModule)) &&
      (!i.permission || hasPermission(user, k, i.permission)),
  );
}

function FlatLink({
  item,
  pathname,
  count = 0,
}: {
  item: NavItem;
  pathname: string;
  count?: number;
}) {
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(ITEM_BASE, active && ITEM_ACTIVE)}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {count > 0 ? (
        <>
          <span
            aria-hidden="true"
            className="shrink-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] leading-none font-bold text-white"
          >
            {count > 99 ? '99+' : count}
          </span>
          <span className="sr-only">{`, ${count} ${lo.topbar.unread}`}</span>
        </>
      ) : null}
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-[#8396b6] uppercase">
      {children}
    </p>
  );
}

export function AppSidebar({ module, className }: { module?: ModuleKey; className?: string }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const pathModule = getModuleFromPath(pathname);
  const activeModule = module ?? pathModule ?? 'ppa';
  const isAdmin = user !== null && isAdminUser(user);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  // For admin: manage open/collapsed state of each module dropdown
  const [openModules, setOpenModules] = useState<Record<ModuleKey, boolean>>(() => {
    return {
      ppa: activeModule === 'ppa',
      gc: activeModule === 'gc',
      legal: activeModule === 'legal',
    };
  });

  // Auto-expand module dropdown when navigating into its path (adjust state during render)
  const currentModule = module ?? pathModule;
  const [prevModule, setPrevModule] = useState(currentModule);
  if (prevModule !== currentModule) {
    setPrevModule(currentModule);
    if (currentModule) {
      setOpenModules((prev) => ({ ...prev, [currentModule]: true }));
    }
  }

  const toggleModule = (k: ModuleKey) => {
    setOpenModules((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const accessibleModules = user ? getAccessibleModules(user) : [];
  const orderedModules = CANONICAL_ORDER.filter((k) => accessibleModules.includes(k));

  return (
    <aside
      className={cn(
        'flex flex-col gap-5 rounded-[24px] border border-[var(--sidebar-border)] p-4 text-[#e8eef9] [--focus-ring:#d4b37a]',
        'bg-[image:var(--surface-navy)]',
        'dark:bg-[image:var(--glass-bg)] dark:shadow-[var(--glass-shadow)] dark:[backdrop-filter:var(--glass-blur)]',
        className,
      )}
    >
      {/* Brand Header */}
      <div className="flex flex-col gap-0.5 px-2 pt-1">
        <span className="font-heading text-xl font-semibold text-[#f3e3c2]">
          {lo.common.appName}
        </span>
        <span className="text-xs text-[#9fb0cc]">{lo.common.appSubtitle}</span>
      </div>

      <nav aria-label={lo.nav.mainMenu} className="flex flex-col gap-1">
        <Link
          href="/"
          className={cn(ITEM_BASE, pathname === '/' && ITEM_ACTIVE)}
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          <Home aria-hidden="true" className="size-4 shrink-0" />
          {lo.common.home}
        </Link>

        {isAdmin ? (
          <>
            <SectionLabel>{lo.nav.allModules}</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {orderedModules.map((k) => {
                const meta = MODULES[k];
                const Icon = meta.icon;
                const accent = ACCENT[k];
                const isOpen = openModules[k] ?? false;
                const isCurrent = activeModule === k;

                const subItems = user ? visibleItems(MODULE_NAV[k], k, user) : [];

                return (
                  <div key={k} className="flex flex-col">
                    {/* Module Dropdown Header Button */}
                    <button
                      type="button"
                      onClick={() => toggleModule(k)}
                      aria-expanded={isOpen}
                      className={cn(
                        'group flex min-h-11 w-full cursor-pointer items-center justify-between rounded-[14px] border border-transparent px-3 py-2 text-sm transition-all duration-150',
                        isCurrent
                          ? 'border-[rgba(212,179,122,0.3)] bg-white/10 font-semibold text-white'
                          : 'text-[#c9d5ea] hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="flex size-7 shrink-0 items-center justify-center rounded-lg border transition-transform duration-150 group-hover:scale-105"
                          style={{
                            color: accent,
                            borderColor: `${accent}40`,
                            backgroundColor: `${accent}18`,
                          }}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="truncate text-xs font-semibold">{meta.name}</span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                          style={{ color: accent, backgroundColor: `${accent}20` }}
                        >
                          {meta.code}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className={cn(
                            'size-4 text-[#8396b6] transition-transform duration-200',
                            isOpen && 'rotate-180 text-white',
                          )}
                        />
                      </div>
                    </button>

                    {/* Sub-menu Items Dropdown */}
                    {isOpen ? (
                      <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-white/10 py-1 pl-2">
                        {subItems.map((item) => {
                          const active = isNavItemActive(pathname, item.href);
                          const ItemIcon = item.icon;
                          return (
                            <Link
                              key={item.key}
                              href={item.href}
                              aria-current={active ? 'page' : undefined}
                              className={cn(
                                'relative flex min-h-9 items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-1.5 text-xs text-[#c9d5ea] transition-all duration-150 hover:bg-white/10 hover:text-white',
                                active &&
                                  'border-[rgba(96,165,250,0.4)] bg-[linear-gradient(90deg,rgba(37,99,235,0.45),rgba(37,99,235,0.1))] font-semibold text-white before:absolute before:inset-y-1.5 before:left-0 before:w-[2.5px] before:rounded-full before:bg-[#d4b37a]',
                              )}
                            >
                              <ItemIcon
                                aria-hidden="true"
                                className="size-3.5 shrink-0 opacity-80"
                              />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          user &&
          orderedModules.map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <SectionLabel>{MODULES[k].name}</SectionLabel>
              {visibleItems(MODULE_NAV[k], k, user).map((item) => (
                <FlatLink key={item.key} item={item} pathname={pathname} />
              ))}
            </div>
          ))
        )}

        <SectionLabel>{lo.nav.commonSection}</SectionLabel>
        {COMMON_NAV.map((item) => (
          <FlatLink
            key={item.key}
            item={item}
            pathname={pathname}
            count={item.countKey === 'unread' ? unreadCount : 0}
          />
        ))}

        {isAdmin ? (
          <>
            <SectionLabel>{lo.admin.section}</SectionLabel>
            {ADMIN_NAV.map((item) => (
              <FlatLink key={item.key} item={item} pathname={pathname} />
            ))}
          </>
        ) : null}
      </nav>

      {/* User Info & Role Badge at Bottom */}
      {user ? (
        <div className="mt-auto flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-white">{user.fullName}</span>
            <span className="shrink-0 rounded-md border border-amber-400/30 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-(--gold) uppercase">
              {lo.roles[user.role]}
            </span>
          </div>
          <span className="truncate text-xs text-[#9fb0cc]">
            {user.division ?? user.department}
          </span>
        </div>
      ) : null}
    </aside>
  );
}
