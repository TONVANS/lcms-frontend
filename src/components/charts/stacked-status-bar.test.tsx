import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { StackedStatusBar } from './stacked-status-bar';

const data = [
  { status: 'active' as const, count: 15 },
  { status: 'negotiating' as const, count: 5 },
  { status: 'expiring' as const, count: 2 },
];

describe('StackedStatusBar', () => {
  it('renders status legend and counts', () => {
    render(<StackedStatusBar data={data} />);
    expect(screen.getByText(lo.status.active)).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText(lo.status.negotiating)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('StackedStatusBar a11y and motion', () => {
  it('exposes an accessible summary', () => {
    render(
      <StackedStatusBar
        data={[
          { status: 'active', count: 3 },
          { status: 'expired', count: 1 },
        ]}
      />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName(
      expect.stringContaining(`${lo.status.active} 3`),
    );
  });

  it('uses Design.md colours in dots and has no transition on segments', () => {
    const { container } = render(<StackedStatusBar data={[{ status: 'active', count: 3 }]} />);
    expect(container.innerHTML).toContain('bg-[#059669]');
    expect(container.innerHTML).toContain('dark:bg-[#34D399]');
    expect(container.innerHTML).not.toContain('transition');
  });
});
