import { expect, it } from 'vitest';
import { formatNumber } from './number';

it('formats numbers with grouping and max fraction digits', () => {
  expect(formatNumber(1240)).toBe('1,240');
  expect(formatNumber(1234.567)).toBe('1,234.57');
});
