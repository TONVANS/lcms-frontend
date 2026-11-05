import { describe, expect, it } from 'vitest';
import { formatLaoScale, formatWithCommas } from './money-input';

describe('formatWithCommas', () => {
  it('formats integer strings with thousand separators as you type', () => {
    expect(formatWithCommas('1000')).toBe('1,000');
    expect(formatWithCommas('1000000')).toBe('1,000,000');
    expect(formatWithCommas('1000000000')).toBe('1,000,000,000');
  });

  it('preserves trailing decimals and decimal numbers as you type', () => {
    expect(formatWithCommas('1000.')).toBe('1,000.');
    expect(formatWithCommas('1000.5')).toBe('1,000.5');
    expect(formatWithCommas('1000.50')).toBe('1,000.50');
  });

  it('handles empty and partial values gracefully', () => {
    expect(formatWithCommas('')).toBe('');
    expect(formatWithCommas('.')).toBe('.');
    expect(formatWithCommas('0')).toBe('0');
    expect(formatWithCommas('0.')).toBe('0.');
  });
});

describe('formatLaoScale', () => {
  it('formats thousands, millions, and billions in Lao units', () => {
    expect(formatLaoScale(1_000)).toBeNull();
    expect(formatLaoScale(10_000)).toBe('1 ໝື່ນ');
    expect(formatLaoScale(100_000)).toBe('1 ແສນ');
    expect(formatLaoScale(1_000_000)).toBe('1 ລ້ານ');
    expect(formatLaoScale(50_000_000)).toBe('50 ລ້ານ');
    expect(formatLaoScale(1_000_000_000)).toBe('1 ຕື້');
    expect(formatLaoScale(2_500_000_000)).toBe('2.5 ຕື້');
  });
});

