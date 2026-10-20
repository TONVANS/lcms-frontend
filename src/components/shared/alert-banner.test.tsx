import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertBanner } from './alert-banner';

describe('AlertBanner', () => {
  it('uses role alert for rose', () => {
    render(<AlertBanner tone="rose" title="T" />);
    expect(screen.getByRole('alert')).toHaveTextContent('T');
  });
  it('uses role status for amber', () => {
    render(<AlertBanner tone="amber" title="A" />);
    expect(screen.getByRole('status')).toHaveTextContent('A');
  });
  it.each(['amber', 'rose'] as const)('clears the light base color in dark for %s', (tone) => {
    render(<AlertBanner tone={tone} title="X" />);
    const el = screen.getByText('X').closest('[role]');
    expect(el).toHaveClass('dark:bg-transparent');
  });
});
