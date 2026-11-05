'use client';

import { Menu, Scale, Zap, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { getModuleFromPath } from '@/config/navigation';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import type { ModuleKey } from '@/types/domain';
import { Breadcrumbs } from './breadcrumbs';
import { NotificationMenu } from './notification-menu';
import { UserMenu } from './user-menu';

const MODULE_PILL: Record<
  ModuleKey,
  {
    code: string;
    icon: typeof Zap;
    color: string;
    border: string;
    bg: string;
    href: string;
  }
> = {
  ppa: {
    code: 'PPA',
    icon: Zap,
    color: '#5cc8ff',
    border: 'rgba(92, 200, 255, 0.35)',
    bg: 'rgba(92, 200, 255, 0.12)',
    href: '/ppa',
  },
  gc: {
    code: 'GC',
    icon: FileText,
    color: '#8b9cff',
    border: 'rgba(139, 156, 255, 0.35)',
    bg: 'rgba(139, 156, 255, 0.12)',
    href: '/contracts',
  },
  legal: {
    code: 'LEGAL',
    icon: Scale,
    color: '#d4b37a',
    border: 'rgba(212, 179, 122, 0.35)',
    bg: 'rgba(212, 179, 122, 0.12)',
    href: '/legal',
  },
};

interface TopbarProps {
  variant: 'module' | 'home';
  moduleKey?: ModuleKey | null;
  /** Mobile sidebar sheet state; the menu button is hidden from md up. */
  menuOpen?: boolean;
  menuControlsId?: string;
  onMenuClick?: () => void;
  className?: string;
}

export function Topbar({
  variant,
  moduleKey,
  menuOpen = false,
  menuControlsId,
  onMenuClick,
  className,
}: TopbarProps) {
  const pathname = usePathname();
  const currentModule = moduleKey ?? getModuleFromPath(pathname);
  const home = variant === 'home' || pathname === '/';
  const pillMeta = currentModule ? MODULE_PILL[currentModule] : null;

  return (
    <header
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-[20px] px-3 py-2 sm:px-4 sm:py-2.5 md:gap-3',
        'backdrop-blur-xl transition-all duration-200',
        home
          ? 'border border-[var(--sidebar-border)] bg-[image:var(--surface-navy)] text-[#e8eef9] shadow-md dark:shadow-xl [--focus-ring:#d4b37a]'
          : 'glass border border-white/60 bg-white/80 shadow-sm dark:border-white/10 dark:bg-[#0b1b3a]/80 dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)]',
        className,
      )}
    >
      {/* Left side: Mobile menu toggle, Module Badge, and Breadcrumbs */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onMenuClick ? (
          <button
            type="button"
            aria-label={lo.topbar.menu}
            aria-expanded={menuOpen}
            aria-controls={menuControlsId}
            onClick={onMenuClick}
            className={cn(
              'inline-flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-150 md:hidden',
              home
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                : 'border-border bg-secondary text-foreground hover:bg-muted',
            )}
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
        ) : null}

        {/* Mobile mini brand logo */}
        <Link href="/" className="flex shrink-0 items-center md:hidden" aria-label={lo.common.appName}>
          <Image
            src="/logo/logo.png"
            alt="LCMS Logo"
            width={26}
            height={26}
            className="size-6.5 object-contain drop-shadow"
            priority
          />
        </Link>

        {/* Module Pill (Context Badge) */}
        {pillMeta && !home ? (
          <Link
            href={pillMeta.href}
            className="hidden items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold transition-transform duration-150 hover:scale-105 sm:inline-flex"
            style={{
              color: pillMeta.color,
              borderColor: pillMeta.border,
              backgroundColor: pillMeta.bg,
            }}
          >
            <pillMeta.icon className="size-3.5" />
            <span>{pillMeta.code}</span>
          </Link>
        ) : null}

        <div className="min-w-0 flex-1 overflow-hidden">
          <Breadcrumbs tone={home ? 'navy' : 'default'} />
        </div>
      </div>

      {/* Right side: Actions Cluster */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ThemeToggle />
        <NotificationMenu />
        <UserMenu />
      </div>
    </header>
  );
}
