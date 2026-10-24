'use client';

import { useState } from 'react';
import { ChevronDown, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MODULE_NAV, getModuleFromPath, isNavItemActive } from '@/config/navigation';
import { useAuthStore } from '@/features/auth';
import { getAccessibleModules, hasPermission } from '@/lib/auth/permissions';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import type { ModuleKey } from '@/types/domain';
import { ModuleSwitcher } from './module-switcher';

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

export function AppSidebar({ module }: { module?: ModuleKey }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const pathModule = getModuleFromPath(pathname);
  const activeModule = module ?? pathModule ?? 'ppa';
  const isAdmin = user?.role === 'admin';

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
        '[--focus-ring:#d4b37a] flex flex-col gap-5 rounded-[24px] border border-[var(--sidebar-border)] p-4 text-[#e8eef9]',
        'bg-[image:var(--surface-navy)]',
        'dark:bg-[image:var(--glass-bg)] dark:shadow-[var(--glass-shadow)] dark:[backdrop-filter:var(--glass-blur)]',
      )}
      style={{ flex: '1 1 248px' }}
    >
      {/* Brand Header */}
      <div className="flex flex-col gap-0.5 px-2 pt-1">
        <span className="font-heading text-xl font-semibold text-[#f3e3c2]">{lo.common.appName}</span>
        <span className="text-xs text-[#9fb0cc]">{lo.common.appSubtitle}</span>
      </div>

      {/* For non-admin multi-module users: keep ModuleSwitcher */}
      {!isAdmin && activeModule ? <ModuleSwitcher current={activeModule} /> : null}

      <nav aria-label={lo.nav.mainMenu} className="flex flex-col gap-1">
        <Link
          href="/"
          className={cn(ITEM_BASE, pathname === '/' && ITEM_ACTIVE)}
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          <Home aria-hidden="true" className="size-4 shrink-0" />
          {lo.common.home}
        </Link>

        <p className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-[#8396b6] uppercase">
          {isAdmin ? 'ໂມດູນທັງໝົດ' : lo.nav.modulesSection}
        </p>

        {isAdmin ? (
          /* Admin Sidebar: Dropdown sub-menu item for each module */
          <div className="flex flex-col gap-1.5">
            {orderedModules.map((k) => {
              const meta = MODULES[k];
              const Icon = meta.icon;
              const accent = ACCENT[k];
              const isOpen = openModules[k] ?? false;
              const isCurrent = activeModule === k;

              // Filter sub-items by user role / permissions
              const subItems = MODULE_NAV[k].filter(
                (item) => !item.permission || (user !== null && hasPermission(user, k, item.permission)),
              );

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
                    <div className="flex items-center gap-2.5 min-w-0">
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

                    <div className="flex items-center gap-1.5 shrink-0">
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
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-white/10 py-1 pl-2">
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
                            <ItemIcon aria-hidden="true" className="size-3.5 shrink-0 opacity-80" />
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
        ) : (
          /* Non-admin Sidebar: Render active module items directly */
          MODULE_NAV[activeModule]
            .filter((i) => !i.permission || (user !== null && hasPermission(user, activeModule, i.permission)))
            .map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(ITEM_BASE, active && ITEM_ACTIVE)}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })
        )}
      </nav>

      {/* User Info & Role Badge at Bottom */}
      {user ? (
        <div className="mt-auto flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-white">{user.fullName}</span>
            <span className="shrink-0 rounded-md bg-amber-500/15 border border-amber-400/30 px-1.5 py-0.5 text-[10px] font-bold text-(--gold) uppercase tracking-wide">
              {user.role}
            </span>
          </div>
          <span className="truncate text-xs text-[#9fb0cc]">{user.departmentName}</span>
        </div>
      ) : null}
    </aside>
  );
}
