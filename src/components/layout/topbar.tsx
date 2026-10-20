'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { SearchInput } from '@/components/shared/search-input';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { Breadcrumbs } from './breadcrumbs';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';

interface TopbarProps {
  unreadCount: number;
  variant: 'module' | 'home';
}

export function Topbar({ unreadCount, variant }: TopbarProps) {
  // Phase 1: search is local state only; no submit behaviour yet.
  const [query, setQuery] = useState('');
  const home = variant === 'home';

  return (
    <header
      className={cn(
        'flex animate-fade-in-down flex-wrap items-center justify-between gap-3 rounded-[20px] px-4 py-3',
        home
          ? '[--focus-ring:#d4b37a] border border-[var(--sidebar-border)] bg-[image:var(--surface-navy)] text-[#e8eef9]'
          : 'glass',
      )}
    >
      <Breadcrumbs tone={home ? 'navy' : 'default'} />
      <div className="flex items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={lo.common.search}
          aria-label={lo.topbar.searchLabel}
          className="hidden w-[280px] md:block"
        />
        <ThemeToggle />
        <NotificationBell unreadCount={unreadCount} />
        <UserMenu />
      </div>
    </header>
  );
}
