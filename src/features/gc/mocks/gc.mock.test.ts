import { describe, expect, it } from 'vitest';
import { deriveGcStatus } from '../lib/derive-status';
import { GC_CONTRACT_TYPES, GC_STATUSES } from '../types';
import { createGcSeed } from './gc.mock';

const today = new Date(2026, 9, 20);

describe('createGcSeed', () => {
  const all = createGcSeed(today);

  it('covers every type, status and currency', () => {
    expect(all).toHaveLength(42);
    for (const t of GC_CONTRACT_TYPES) expect(all.filter((c) => c.type === t)).toHaveLength(3);
    expect(new Set(all.map((c) => deriveGcStatus(c, today)))).toEqual(new Set(GC_STATUSES));
    expect(new Set(all.flatMap((c) => (c.value ? [c.value.currency] : [])))).toEqual(
      new Set(['LAK', 'USD', 'CNY']),
    );
    expect(all.filter((c) => c.endDate === null).length).toBeGreaterThanOrEqual(3);
    expect(all.filter((c) => c.value === null).length).toBeGreaterThanOrEqual(4);
  });

  it('has the required status counts and end-date offsets', () => {
    const statuses = all.map((c) => deriveGcStatus(c, today));
    expect(statuses.filter((s) => s === 'pending').length).toBeGreaterThanOrEqual(3);
    expect(statuses.filter((s) => s === 'expiring').length).toBeGreaterThanOrEqual(6);
    expect(statuses.filter((s) => s === 'expired').length).toBeGreaterThanOrEqual(5);
    const ends = new Set(all.map((c) => c.endDate));
    // 2026-10-20 + 0, 3, 7, 25, 45, 60
    for (const d of ['2026-10-20', '2026-10-23', '2026-10-27', '2026-11-14', '2026-12-04', '2026-12-19']) {
      expect(ends.has(d)).toBe(true);
    }
    // 2026-10-20 - 1, 10, 25, 40, 200
    for (const d of ['2026-10-19', '2026-10-10', '2026-09-25', '2026-09-10', '2026-04-03']) {
      expect(ends.has(d)).toBe(true);
    }
  });

  it('puts equity percent on shareholding and amount on cooperation', () => {
    for (const c of all.filter((x) => x.type === 'shareholding')) expect(c.equity?.kind).toBe('percent');
    for (const c of all.filter((x) => x.type === 'cooperation')) expect(c.equity?.kind).toBe('amount');
  });

  it('has unique ids and contract numbers', () => {
    expect(new Set(all.map((c) => c.id)).size).toBe(42);
    expect(new Set(all.map((c) => c.contractNo)).size).toBe(42);
  });
});
