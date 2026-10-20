'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { lo } from '@/lib/i18n/lo';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  return (
    <button
      type="button"
      aria-label={lo.topbar.themeToggle}
      aria-pressed={isLight}
      suppressHydrationWarning
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary text-foreground transition-colors duration-150 hover:bg-muted"
    >
      <Sun aria-hidden="true" className="hidden size-5 dark:block" />
      <Moon aria-hidden="true" className="size-5 dark:hidden" />
    </button>
  );
}
