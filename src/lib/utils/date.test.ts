import { describe, expect, it } from 'vitest';
import { LAO_MONTHS_SHORT, LAO_WEEKDAYS, daysLeft, formatDate, formatMonthYear } from './date';

describe('date utils', () => {
  it('formats dates as dd/MM/yyyy', () => {
    expect(formatDate('2026-03-05')).toBe('05/03/2026');
    expect(formatDate('2026-03-05T23:30:00+07:00')).toBe('05/03/2026');
  });
  it('returns a dash for empty values', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate(null)).toBe('—');
    expect(formatMonthYear(undefined)).toBe('—');
  });
  it('formats month/year', () => {
    expect(formatMonthYear('2026-03-05')).toBe('03/2026');
  });
  it('exposes Lao month and weekday names', () => {
    expect(LAO_MONTHS_SHORT[0]).toBe('ມ.ກ.');
    expect(LAO_MONTHS_SHORT[11]).toBe('ທ.ວ.');
    expect(LAO_WEEKDAYS).toHaveLength(7);
    expect(LAO_WEEKDAYS[0]).toBe('ຈ');
  });
  it('counts calendar days left', () => {
    const today = new Date(2026, 9, 20, 23, 30);
    expect(daysLeft('2026-10-20', today)).toBe(0);
    expect(daysLeft('2026-10-27', today)).toBe(7);
    expect(daysLeft('2026-10-17', today)).toBe(-3);
  });
});
