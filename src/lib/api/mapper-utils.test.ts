import { describe, expect, it } from 'vitest';
import { isRecord, pickEnum, toCountEntries } from './mapper-utils';

describe('mapper-utils', () => {
  describe('isRecord', () => {
    it('returns true for plain objects and false for primitives/arrays/null', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ a: 1 })).toBe(true);
      expect(isRecord(null)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
      expect(isRecord([])).toBe(false);
      expect(isRecord('string')).toBe(false);
      expect(isRecord(123)).toBe(false);
    });
  });

  describe('pickEnum', () => {
    const STATUSES = ['ACTIVE', 'INACTIVE', 'DRAFT'] as const;
    it('matches case-insensitively and trims', () => {
      expect(pickEnum(' active ', STATUSES, 'DRAFT')).toBe('ACTIVE');
      expect(pickEnum('INACTIVE', STATUSES, 'DRAFT')).toBe('INACTIVE');
    });

    it('falls back when invalid or non-string', () => {
      expect(pickEnum('UNKNOWN', STATUSES, 'DRAFT')).toBe('DRAFT');
      expect(pickEnum(null, STATUSES, 'DRAFT')).toBe('DRAFT');
      expect(pickEnum(123, STATUSES, 'DRAFT')).toBe('DRAFT');
    });
  });

  describe('toCountEntries', () => {
    it('extracts counts from object map', () => {
      const res = toCountEntries({ ACTIVE: 10, INACTIVE: 5 }, ['status']);
      expect(res).toEqual([
        { key: 'ACTIVE', count: 10, row: null },
        { key: 'INACTIVE', count: 5, row: null },
      ]);
    });

    it('extracts counts from groupBy array with _count', () => {
      const res = toCountEntries(
        [
          { status: 'ACTIVE', _count: { id: 12 } },
          { status: 'INACTIVE', _count: { id: 3 } },
        ],
        ['status'],
      );
      expect(res).toEqual([
        { key: 'ACTIVE', count: 12, row: { status: 'ACTIVE', _count: { id: 12 } } },
        { key: 'INACTIVE', count: 3, row: { status: 'INACTIVE', _count: { id: 3 } } },
      ]);
    });

    it('returns empty array for non-records / non-arrays', () => {
      expect(toCountEntries(null, ['status'])).toEqual([]);
      expect(toCountEntries(123, ['status'])).toEqual([]);
    });
  });
});

