import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { ThemeToggle } from './theme-toggle';

const setTheme = vi.fn();
let theme = 'dark';

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: theme, setTheme }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    setTheme.mockClear();
  });

  it('switches dark to light and exposes pressed state', async () => {
    theme = 'dark';
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: lo.topbar.themeToggle }));
    expect(setTheme).toHaveBeenCalledWith('light');
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches light to dark and is pressed when light', async () => {
    theme = 'light';
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button'));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
