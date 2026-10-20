import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import type { Alert } from '@/types/domain';
import { UpcomingList } from './upcoming-list';

function mk(id: string, offset: number, module: Alert['module'] = 'ppa'): Alert {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    id,
    module,
    entityType: 'contract',
    entityId: id,
    title: `Title ${id}`,
    dueDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    daysLeft: offset,
    read: false,
  };
}

describe('UpcomingList', () => {
  it('renders countdown badges and links to the module dashboard', () => {
    render(<UpcomingList alerts={[mk('a', 0), mk('b', 5, 'gc'), mk('c', 20, 'legal')]} />);
    expect(screen.getByText('Title a')).toBeInTheDocument();
    expect(screen.getByText(lo.countdown.today)).toBeInTheDocument();
    expect(screen.getByText(lo.countdown.daysLeft(5))).toBeInTheDocument();
    expect(screen.getByText(lo.countdown.daysLeft(20))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Title b/ })).toHaveAttribute('href', '/contracts');
  });

  it('renders the empty state', () => {
    render(<UpcomingList alerts={[]} />);
    expect(screen.getByText(lo.home.noUpcoming)).toBeInTheDocument();
  });
});
