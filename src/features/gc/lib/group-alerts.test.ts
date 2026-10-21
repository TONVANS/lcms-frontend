import { describe, expect, it } from 'vitest';
import type { Alert } from '@/types/domain';
import { groupGcAlerts } from './group-alerts';

const today = new Date(2026, 9, 20, 15, 30);

function at(offset: number): string {
  const d = new Date(2026, 9, 20 + offset);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const mk = (id: string, offset: number): Alert => ({
  id,
  module: 'gc',
  entityType: 'gc-contract',
  entityId: id,
  title: id,
  dueDate: at(offset),
  daysLeft: offset,
  read: false,
});

describe('groupGcAlerts', () => {
  it.each([
    [-5, 'overdue'],
    [0, 'overdue'],
    [1, 'd7'],
    [7, 'd7'],
    [8, 'd30'],
    [30, 'd30'],
    [31, 'd60'],
    [60, 'd60'],
  ])('puts %i days left in %s', (offset, key) => {
    const groups = groupGcAlerts([mk('a', offset)], today);
    expect(groups.map((g) => g.key)).toEqual([key]);
    expect(groups[0].alerts.map((a) => a.id)).toEqual(['a']);
  });

  it('drops alerts beyond 60 days', () => {
    expect(groupGcAlerts([mk('a', 61)], today)).toEqual([]);
  });

  it('orders groups, hides empty ones and sorts each by dueDate ascending', () => {
    const groups = groupGcAlerts(
      [mk('c', 40), mk('b2', 5), mk('a', 0), mk('b1', 2), mk('c0', 31)],
      today,
    );
    expect(groups.map((g) => g.key)).toEqual(['overdue', 'd7', 'd60']);
    expect(groups[1].alerts.map((x) => x.id)).toEqual(['b1', 'b2']);
    expect(groups[2].alerts.map((x) => x.id)).toEqual(['c0', 'c']);
  });
});
