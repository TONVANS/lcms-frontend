'use client';

import { useEffect, useState } from 'react';
import {
  ChevronDown,
  Home,
  KeyRound,
  LogOut,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useAlertCountsStore } from '@/stores/alert-counts.store';
import type { ModuleKey, User } from '@/types/domain';
import { ChangePasswordDialog } from './change-password-dialog';

const ITEM_BASE =
  'relative flex min-h-10 items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-[#c9d5ea] transition-all duration-150 hover:bg-white/10 hover:text-white';
const ITEM_ACTIVE =
  'border-[rgba(96,165,250,0.4)] bg-[linear-gradient(90deg,rgba(37,99,235,0.45),rgba(37,99,235,0.12))] font-semibold text-white shadow-sm before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-[#d4b37a]';

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
  badgeTone = 'rose',
  onClick,
}: {
  item: NavItem;
  pathname: string;
  count?: number;
  badgeTone?: 'rose' | 'amber';
  onClick?: () => void;
}) {
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(ITEM_BASE, active && ITEM_ACTIVE)}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0 opacity-90" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {count > 0 ? (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold shadow-sm',
              badgeTone === 'amber'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold'
                : 'bg-rose-500 text-white',
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
          <span className="sr-only">
            {badgeTone === 'amber'
              ? `, ${count} ${lo.status.EXPIRING_SOON}`
              : `, ${count} ${lo.topbar.unread}`}
          </span>
        </>
      ) : null}
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-1">
      <span className="text-[10px] font-bold tracking-wider text-[#8396b6] uppercase">
        {children}
      </span>
      <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
    </div>
  );
}

export function AppSidebar({
  module,
  className,
  onClose,
}: {
  module?: ModuleKey;
  className?: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const pathModule = getModuleFromPath(pathname);
  const activeModule = module ?? pathModule ?? 'ppa';
  const isAdmin = user !== null && isAdminUser(user);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const ppaExpiringCount = useAlertCountsStore((s) => s.ppaExpiringCount);
  const gcExpiringCount = useAlertCountsStore((s) => s.gcExpiringCount);
  const [passwordOpen, setPasswordOpen] = useState(false);

  // Fetch alert counts for PPA & GC when user is present
  useEffect(() => {
    if (user) {
      void useAlertCountsStore.getState().fetch(user);
    }
  }, [user]);

  const getModuleAlertCount = (k: ModuleKey): number => {
    if (k === 'ppa') return ppaExpiringCount;
    if (k === 'gc') return gcExpiringCount;
    return 0;
  };

  const getItemCount = (k: ModuleKey, item: NavItem): number => {
    if (item.countKey === 'expiringSoon' || item.key === 'alerts') {
      return getModuleAlertCount(k);
    }
    return 0;
  };

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

  async function handleLogout() {
    await useAuthStore.getState().logout();
    toast.success(lo.auth.logoutSuccess);
    router.replace('/login?reason=logout');
  }

  const initial = user ? Array.from(user.fullName)[0] ?? '' : '';

  return (
    <aside
      className={cn(
        'flex h-full flex-col rounded-[24px] border border-[var(--sidebar-border)] p-3.5 text-[#e8eef9] sm:p-4 [--focus-ring:#d4b37a]',
        'bg-[image:var(--surface-navy)]',
        'dark:bg-[image:var(--glass-bg)] dark:shadow-[var(--glass-shadow)] dark:[backdrop-filter:var(--glass-blur)]',
        className,
      )}
    >
      {/* Brand Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-1 pb-3">
        <Link
          href="/"
          onClick={onClose}
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-gradient-to-br from-blue-950/80 via-slate-900/90 to-blue-950/80 p-1 shadow-md shadow-blue-950/50 transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/logo/logo.png"
              alt="LCMS Logo"
              width={36}
              height={36}
              className="size-8 object-contain drop-shadow"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-tight text-[#f3e3c2]">
              {lo.common.appName}
            </span>
            <span className="text-[11px] leading-tight text-[#9fb0cc] line-clamp-1">
              {lo.common.appSubtitle}
            </span>
          </div>
        </Link>

        {/* Close Button when inside Mobile Sheet Drawer */}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={lo.common.close}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white md:hidden"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Navigation List with Sleek Scrollbar */}
      <nav
        aria-label={lo.nav.mainMenu}
        className="custom-scrollbar my-2 flex flex-1 min-h-0 flex-col gap-1 overflow-y-auto pr-1"
      >
        <Link
          href="/"
          onClick={onClose}
          className={cn(ITEM_BASE, pathname === '/' && ITEM_ACTIVE)}
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          <Home aria-hidden="true" className="size-4 shrink-0 opacity-90" />
          <span className="min-w-0 flex-1 truncate">{lo.common.home}</span>
        </Link>

        {isAdmin ? (
          <>
            <SectionLabel>{lo.nav.allModules}</SectionLabel>
            <div className="flex flex-col gap-1">
              {orderedModules.map((k) => {
                const meta = MODULES[k];
                const Icon = meta.icon;
                const accent = ACCENT[k];
                const isOpen = openModules[k] ?? false;
                const isCurrent = activeModule === k;
                const moduleAlertCount = getModuleAlertCount(k);

                const subItems = user ? visibleItems(MODULE_NAV[k], k, user) : [];

                return (
                  <div key={k} className="flex flex-col">
                    {/* Module Dropdown Header Button */}
                    <button
                      type="button"
                      onClick={() => toggleModule(k)}
                      aria-expanded={isOpen}
                      className={cn(
                        'group flex min-h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm transition-all duration-150',
                        isCurrent
                          ? 'border-[rgba(212,179,122,0.3)] bg-white/10 font-semibold text-white'
                          : 'text-[#c9d5ea] hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="flex size-6 shrink-0 items-center justify-center rounded-lg border transition-transform duration-150 group-hover:scale-105"
                          style={{
                            color: accent,
                            borderColor: `${accent}40`,
                            backgroundColor: `${accent}18`,
                          }}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <span className="truncate text-xs font-semibold">{meta.name}</span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {moduleAlertCount > 0 ? (
                          <span
                            className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300"
                            title={`${moduleAlertCount} ${lo.status.EXPIRING_SOON}`}
                          >
                            <span className="size-1.5 rounded-full bg-amber-400" />
                            {moduleAlertCount > 99 ? '99+' : moduleAlertCount}
                          </span>
                        ) : null}
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase"
                          style={{ color: accent, backgroundColor: `${accent}20` }}
                        >
                          {meta.code}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className={cn(
                            'size-3.5 text-[#8396b6] transition-transform duration-200',
                            isOpen && 'rotate-180 text-white',
                          )}
                        />
                      </div>
                    </button>

                    {/* Sub-menu Items Dropdown */}
                    {isOpen ? (
                      <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-white/15 py-1 pl-2">
                        {subItems.map((item) => {
                          const active = isNavItemActive(pathname, item.href);
                          const ItemIcon = item.icon;
                          const count = getItemCount(k, item);
                          const isAlertItem = item.countKey === 'expiringSoon' || item.key === 'alerts';
                          return (
                            <Link
                              key={item.key}
                              href={item.href}
                              onClick={onClose}
                              aria-current={active ? 'page' : undefined}
                              className={cn(
                                'relative flex min-h-8 items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs text-[#c9d5ea] transition-all duration-150 hover:bg-white/10 hover:text-white',
                                active &&
                                  'border-[rgba(96,165,250,0.4)] bg-[linear-gradient(90deg,rgba(37,99,235,0.45),rgba(37,99,235,0.12))] font-semibold text-white before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-[#d4b37a]',
                              )}
                            >
                              <ItemIcon
                                aria-hidden="true"
                                className="size-3.5 shrink-0 opacity-80"
                              />
                              <span className="truncate">{item.label}</span>
                              {count > 0 ? (
                                <>
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold shadow-sm',
                                      isAlertItem
                                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold'
                                        : 'bg-rose-500 text-white',
                                    )}
                                  >
                                    {count > 99 ? '99+' : count}
                                  </span>
                                  <span className="sr-only">
                                    {isAlertItem
                                      ? `, ${count} ${lo.status.EXPIRING_SOON}`
                                      : `, ${count} ${lo.topbar.unread}`}
                                  </span>
                                </>
                              ) : null}
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
                <FlatLink
                  key={item.key}
                  item={item}
                  pathname={pathname}
                  count={getItemCount(k, item)}
                  badgeTone={item.countKey === 'expiringSoon' || item.key === 'alerts' ? 'amber' : 'rose'}
                  onClick={onClose}
                />
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
            badgeTone="rose"
            onClick={onClose}
          />
        ))}

        {isAdmin ? (
          <>
            <SectionLabel>{lo.admin.section}</SectionLabel>
            {ADMIN_NAV.map((item) => (
              <FlatLink
                key={item.key}
                item={item}
                pathname={pathname}
                onClick={onClose}
              />
            ))}
          </>
        ) : null}
      </nav>

      {/* User Info & Actions Card at Bottom (Pinned) */}
      {user ? (
        <div className="mt-auto shrink-0 border-t border-white/10 pt-2.5">
          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar className="size-8 shrink-0 border border-white/20">
                <AvatarFallback className="bg-[image:var(--primary-gradient)] text-xs font-semibold text-white">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold text-white">{user.fullName}</span>
                <span className="truncate text-[10px] text-[#9fb0cc]">
                  {user.division ?? user.department}
                </span>
              </div>
              <span className="shrink-0 rounded-md border border-amber-400/30 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#f3e3c2] uppercase">
                {user.roleTitle || lo.roles[user.role] || user.role}
              </span>
            </div>

            {/* Quick Actions Shortcuts in Sidebar */}
            <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                className="flex items-center gap-1.5 text-[#9fb0cc] transition-colors hover:text-white"
                title={lo.users.changePassword}
              >
                <KeyRound className="size-3.5" />
                <span>{lo.users.changePassword}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 text-rose-400 transition-colors hover:text-rose-300"
                title={lo.auth.logout}
              >
                <LogOut className="size-3.5" />
                <span>{lo.auth.logout}</span>
              </button>
            </div>
          </div>
          <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
        </div>
      ) : null}
    </aside>
  );
}
