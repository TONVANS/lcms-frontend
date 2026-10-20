'use client';

import Link from 'next/link';
import { useAuthStore } from '@/features/auth';
import { getAccessibleModules } from '@/lib/auth/permissions';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import type { ModuleKey } from '@/types/domain';

// Sidebar is navy in both themes, so the dark-theme accents are always the readable ones.
const ACCENT: Record<ModuleKey, string> = {
  ppa: '#5cc8ff',
  gc: '#8b9cff',
  legal: '#d4b37a',
};

export function ModuleSwitcher({ current }: { current: ModuleKey }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  const accessible = getAccessibleModules(user);
  if (accessible.length < 2) return null;

  const CurrentIcon = MODULES[current].icon;

  return (
    <nav
      aria-label={lo.nav.moduleSwitcher}
      className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-2"
    >
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border"
          style={{
            color: ACCENT[current],
            borderColor: `${ACCENT[current]}4d`,
            background: `${ACCENT[current]}1f`,
          }}
        >
          <CurrentIcon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold tracking-wide" style={{ color: ACCENT[current] }}>
            {MODULES[current].code}
          </span>
          <span className="text-sm font-semibold text-white">{MODULES[current].name}</span>
        </span>
      </div>
      {accessible
        .filter((k) => k !== current)
        .map((k) => {
          const Icon = MODULES[k].icon;
          return (
            <Link
              key={k}
              href={MODULES[k].href}
              className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-sm text-[#c9d5ea] transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" style={{ color: ACCENT[k] }} />
              <span>{MODULES[k].name}</span>
            </Link>
          );
        })}
    </nav>
  );
}
