import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { buildGcKeyDates } from './key-dates';

const today = new Date(2026, 9, 20); // 2026-10-20 local

const mk = (signedDate: string, effectiveDate: string, endDate: string | null) => ({
  signedDate,
  effectiveDate,
  endDate,
});

const keys = (items: { key: string }[]) => items.map((i) => i.key);
const statuses = (items: { status: string }[]) => items.map((i) => i.status);

describe('buildGcKeyDates', () => {
  it('lists signed, effective, alert points and end chronologically', () => {
    const items = buildGcKeyDates(mk('2026-01-01', '2026-01-10', '2027-01-10'), today);
    expect(keys(items)).toEqual(['signed', 'effective', 'alert-60', 'alert-30', 'alert-7', 'end']);
    expect(items.map((i) => i.date)).toEqual([
      '2026-01-01',
      '2026-01-10',
      '2026-11-11',
      '2026-12-11',
      '2027-01-03',
      '2027-01-10',
    ]);
    expect(items[2]!.label).toBe(lo.gc.detail.alertAt(60));
    expect(items[0]!.label).toBe(lo.gc.fields.signedDate);
    expect(items[5]!.label).toBe(lo.gc.fields.endDate);
    expect(statuses(items)).toEqual(['done', 'done', 'current', 'future', 'future', 'future']);
  });

  it('drops alert points dated before the effective date (20-day contract)', () => {
    const items = buildGcKeyDates(mk('2026-09-20', '2026-10-01', '2026-10-21'), today);
    expect(keys(items)).toEqual(['signed', 'effective', 'alert-7', 'end']);
    expect(statuses(items)).toEqual(['done', 'done', 'done', 'current']);
  });

  it('drops an alert point that falls on an already listed date', () => {
    // alert-60 = 2026-11-01 = effective date
    const items = buildGcKeyDates(mk('2026-10-01', '2026-11-01', '2026-12-31'), today);
    expect(keys(items)).toEqual(['signed', 'effective', 'alert-30', 'alert-7', 'end']);
  });

  it('open-ended contract has signed and effective only', () => {
    const items = buildGcKeyDates(mk('2026-01-01', '2026-01-10', null), today);
    expect(keys(items)).toEqual(['signed', 'effective']);
    expect(statuses(items)).toEqual(['done', 'done']);
  });

  it('has no current item when every date is past', () => {
    const items = buildGcKeyDates(mk('2024-01-01', '2024-01-10', '2025-01-10'), today);
    expect(items.length).toBeGreaterThan(2);
    expect(statuses(items).every((s) => s === 'done')).toBe(true);
  });

  it('marks the first item current when every date is in the future (pending)', () => {
    const items = buildGcKeyDates(mk('2027-01-01', '2027-02-01', '2028-02-01'), today);
    expect(keys(items)).toEqual(['signed', 'effective', 'alert-60', 'alert-30', 'alert-7', 'end']);
    expect(statuses(items)).toEqual(['current', 'future', 'future', 'future', 'future', 'future']);
  });

  it('treats a date equal to today as current, not done', () => {
    const items = buildGcKeyDates(mk('2026-01-01', '2026-01-10', '2026-10-20'), today);
    expect(items.at(-1)).toMatchObject({ key: 'end', status: 'current' });
  });
});
