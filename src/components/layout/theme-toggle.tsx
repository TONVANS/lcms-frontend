'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { lo } from '@/lib/i18n/lo';

const subscribe = () => () => {};

export function ThemeToggle() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = mounted && resolvedTheme === 'light';

  return (
    <button
      type="button"
      aria-label={lo.topbar.themeToggle}
      aria-pressed={isLight}
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary text-foreground transition-colors duration-150 hover:bg-muted"
    >
      <Sun aria-hidden="true" className="hidden size-5 dark:block" />
      <Moon aria-hidden="true" className="size-5 dark:hidden" />
    </button>
  );
}
