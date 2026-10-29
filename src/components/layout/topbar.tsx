'use client';

import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { Breadcrumbs } from './breadcrumbs';
import { NotificationMenu } from './notification-menu';
import { UserMenu } from './user-menu';

interface TopbarProps {
  variant: 'module' | 'home';
  /** Mobile sidebar sheet state; the menu button is hidden from md up. */
  menuOpen?: boolean;
  menuControlsId?: string;
  onMenuClick?: () => void;
}

export function Topbar({ variant, menuOpen = false, menuControlsId, onMenuClick }: TopbarProps) {
  const home = variant === 'home';

  return (
    <header
      className={cn(
        'animate-fade-in-down flex flex-wrap items-center justify-between gap-3 rounded-[20px] px-4 py-3',
        home
          ? 'border border-[var(--sidebar-border)] bg-[image:var(--surface-navy)] text-[#e8eef9] [--focus-ring:#d4b37a]'
          : 'glass',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {onMenuClick ? (
          <button
            type="button"
            aria-label={lo.topbar.menu}
            aria-expanded={menuOpen}
            aria-controls={menuControlsId}
            onClick={onMenuClick}
            className={cn(
              'inline-flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-150 md:hidden',
              home
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                : 'border-border bg-secondary text-foreground hover:bg-muted',
            )}
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
        ) : null}
        <Breadcrumbs tone={home ? 'navy' : 'default'} />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationMenu />
        <UserMenu />
      </div>
    </header>
  );
}
