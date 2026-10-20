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
