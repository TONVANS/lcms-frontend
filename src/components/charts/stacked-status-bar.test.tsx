import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { StackedStatusBar } from './stacked-status-bar';

const data = [
  { status: 'ACTIVE' as const, count: 15 },
  { status: 'DRAFT' as const, count: 5 },
  { status: 'EXPIRING_SOON' as const, count: 2 },
];

describe('StackedStatusBar', () => {
  it('renders status legend and counts', () => {
    render(<StackedStatusBar data={data} />);
    expect(screen.getByText(lo.status.ACTIVE)).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText(lo.status.DRAFT)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('StackedStatusBar a11y and motion', () => {
  it('exposes an accessible summary', () => {
    render(
      <StackedStatusBar
        data={[
          { status: 'ACTIVE', count: 3 },
          { status: 'EXPIRED', count: 1 },
        ]}
      />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName(
      expect.stringContaining(`${lo.status.ACTIVE} 3`),
    );
  });

  it('uses Design.md colours in dots and has no transition on segments', () => {
    const { container } = render(<StackedStatusBar data={[{ status: 'ACTIVE', count: 3 }]} />);
    expect(container.innerHTML).toContain('bg-[#059669]');
    expect(container.innerHTML).toContain('dark:bg-[#34D399]');
    expect(container.innerHTML).not.toContain('transition');
  });
});

describe('StackedStatusBar custom label and tone', () => {
  const gc = [
    { status: 'EXPIRING_SOON', count: 2 },
    { status: 'EXPIRED', count: 1 },
  ];

  it('uses getLabel for legend, summary and tooltip', () => {
    render(
      <StackedStatusBar
        data={gc}
        getLabel={(s) => `custom-${s}`}
        getTone={() => 'rose'}
      />,
    );
    expect(screen.getByText('custom-EXPIRING_SOON')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(
      expect.stringContaining('custom-EXPIRED 1'),
    );
    expect(screen.getByTitle(/^custom-EXPIRED: 1/)).toBeInTheDocument();
  });

  it('uses getTone for the segment and dot colours', () => {
    const { container } = render(
      <StackedStatusBar data={gc} getLabel={(s) => s} getTone={() => 'violet'} />,
    );
    expect(container.innerHTML).not.toContain('bg-[#059669]');
    expect(container.querySelectorAll('[class*="bg-[#7C3AED]"], [class*="bg-violet"]').length).toBeGreaterThan(0);
  });

  it('keeps STATUS_META defaults when no props are given', () => {
    render(<StackedStatusBar data={[{ status: 'ACTIVE', count: 3 }]} />);
    expect(screen.getByText(lo.status.ACTIVE)).toBeInTheDocument();
  });
});
