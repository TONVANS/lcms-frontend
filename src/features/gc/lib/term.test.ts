import { describe, expect, it } from 'vitest';
import { suggestTermText } from './term';

describe('suggestTermText', () => {
  it('formats years, months and days in lao', () => {
    expect(suggestTermText('2026-01-01', '2031-01-01')).toBe('5 ປີ');
    expect(suggestTermText('2026-01-01', '2027-04-01')).toBe('1 ປີ 3 ເດືອນ');
    expect(suggestTermText('2026-01-01', '2026-01-21')).toBe('20 ມື້');
    expect(suggestTermText('2026-01-01', '2026-03-01')).toBe('2 ເດືອນ');
  });
});
