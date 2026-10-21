'use client';

import { Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MODULE_NAV, isNavItemActive } from '@/config/navigation';
import { useAuthStore } from '@/features/auth';
import { hasPermission } from '@/lib/auth/permissions';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import type { ModuleKey } from '@/types/domain';
import { ModuleSwitcher } from './module-switcher';

const ITEM_BASE =
  'relative flex min-h-11 items-center gap-3 rounded-[14px] border border-transparent px-3 py-2 text-sm text-[#c9d5ea] transition-colors duration-150 hover:bg-white/10 hover:text-white';
const ITEM_ACTIVE =
  'border-[rgba(96,165,250,0.4)] bg-[linear-gradient(90deg,rgba(37,99,235,0.45),rgba(37,99,235,0.1))] font-semibold text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-[#d4b37a]';

export function AppSidebar({ module }: { module: ModuleKey }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className={cn(
        '[--focus-ring:#d4b37a] flex flex-col gap-5 rounded-[24px] border border-[var(--sidebar-border)] p-4 text-[#e8eef9]',
        'bg-[image:var(--surface-navy)]',
        'dark:bg-[image:var(--glass-bg)] dark:shadow-[var(--glass-shadow)] dark:[backdrop-filter:var(--glass-blur)]',
      )}
      style={{ flex: '1 1 248px' }}
    >
      <div className="flex flex-col gap-0.5 px-2 pt-1">
        <span className="font-heading text-xl font-semibold text-[#f3e3c2]">{lo.common.appName}</span>
        <span className="text-xs text-[#9fb0cc]">{lo.common.appSubtitle}</span>
      </div>

      <ModuleSwitcher current={module} />

      <nav aria-label={lo.nav.mainMenu} className="flex flex-col gap-1">
        <Link href="/" className={ITEM_BASE}>
          <Home aria-hidden="true" className="size-4 shrink-0" />
          {lo.common.home}
        </Link>
        <p className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-[#8396b6]">
          {lo.nav.modulesSection}
        </p>
        {MODULE_NAV[module]
          .filter((i) => !i.permission || (user !== null && hasPermission(user, module, i.permission)))
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
        })}
      </nav>

      {user ? (
        <div className="mt-auto flex flex-col gap-0.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <span className="text-sm font-semibold text-white">{user.fullName}</span>
          <span className="text-xs text-[#9fb0cc]">{user.departmentName}</span>
        </div>
      ) : null}
    </aside>
  );
}
