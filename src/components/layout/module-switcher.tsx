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

const CANONICAL_ORDER: ModuleKey[] = ['ppa', 'gc', 'legal'];

export function ModuleSwitcher({ current }: { current: ModuleKey }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  const accessible = getAccessibleModules(user);
  if (accessible.length < 2) return null;

  const orderedAccessible = CANONICAL_ORDER.filter((k) => accessible.includes(k));

  return (
    <nav
      aria-label={lo.nav.moduleSwitcher}
      className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-xs"
    >
      <div className="flex items-center justify-between px-2 pt-0.5 pb-1">
        <span className="text-[11px] font-semibold tracking-wider text-[#8396b6] uppercase">
          {lo.nav.moduleSwitcher}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {orderedAccessible.map((k) => {
          const isCurrent = k === current;
          const Icon = MODULES[k].icon;
          const accent = ACCENT[k];

          if (isCurrent) {
            return (
              <div
                key={k}
                aria-current="page"
                className="relative flex items-center justify-between gap-2.5 rounded-xl border px-2.5 py-2 text-white shadow-xs transition-all duration-150"
                style={{
                  borderColor: `${accent}40`,
                  background: `linear-gradient(90deg, ${accent}22, ${accent}08)`,
                }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-inner"
                    style={{
                      color: accent,
                      borderColor: `${accent}4d`,
                      background: `${accent}22`,
                    }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-[10px] font-bold tracking-wider leading-none" style={{ color: accent }}>
                      {MODULES[k].code}
                    </span>
                    <span className="truncate text-xs font-semibold text-white mt-0.5">
                      {MODULES[k].name}
                    </span>
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className="flex size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: accent,
                    boxShadow: `0 0 8px ${accent}`,
                  }}
                />
              </div>
            );
          }

          return (
            <Link
              key={k}
              href={MODULES[k].href}
              className="group relative flex items-center justify-between gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-[#c9d5ea] transition-all duration-150 hover:border-white/10 hover:bg-white/10 hover:text-white"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors group-hover:border-white/20 group-hover:bg-white/10"
                  style={{ color: accent }}
                >
                  <Icon className="size-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-medium tracking-wider text-[#8396b6] leading-none group-hover:text-[#9fb0cc]">
                    {MODULES[k].code}
                  </span>
                  <span className="truncate text-xs text-[#c9d5ea] group-hover:text-white mt-0.5">
                    {MODULES[k].name}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
