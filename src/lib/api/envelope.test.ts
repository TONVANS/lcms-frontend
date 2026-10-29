import { describe, expect, it } from 'vitest';
import { toIsoDate, toNum, toStr, unwrap, unwrapPage } from './envelope';

const req = { page: 2, pageSize: 10 };
const map = (raw: unknown) => (raw as { id: number }).id;

describe('unwrap', () => {
  it('unwraps { data: T }', () => {
    expect(unwrap<{ id: string }>({ data: { id: 'a' } })).toEqual({ id: 'a' });
  });
  it('passes raw bodies through', () => {
    expect(unwrap<{ id: string }>({ id: 'a' })).toEqual({ id: 'a' });
    expect(unwrap<number[]>([1, 2])).toEqual([1, 2]);
    expect(unwrap<null>(null)).toBeNull();
    expect(unwrap<string>('x')).toBe('x');
  });
  it('does not double-unwrap', () => {
    expect(unwrap({ data: { data: 1 } })).toEqual({ data: 1 });
  });
});

describe('unwrapPage', () => {
  it('accepts a bare array', () => {
    expect(unwrapPage([{ id: 1 }, { id: 2 }], req, map)).toEqual({
      items: [1, 2],
      page: 2,
      pageSize: 10,
      total: 2,
    });
  });
  it('accepts { data: [], meta.total }', () => {
    const body = { data: [{ id: 1 }], meta: { total: 41, page: 2, limit: 10, totalPages: 5 } };
    expect(unwrapPage(body, req, map)).toEqual({ items: [1], page: 2, pageSize: 10, total: 41 });
  });
  it('accepts meta.totalItems', () => {
    const body = { data: [{ id: 1 }], meta: { totalItems: 7 } };
    expect(unwrapPage(body, req, map).total).toBe(7);
  });
  it('accepts pagination.total', () => {
    const body = { data: [{ id: 1 }], pagination: { total: 9 } };
    expect(unwrapPage(body, req, map).total).toBe(9);
  });
  it('accepts { data: { items, total } }', () => {
    const body = { data: { items: [{ id: 3 }], total: 12 } };
    expect(unwrapPage(body, req, map)).toMatchObject({ items: [3], total: 12 });
  });
  it('accepts { data: { data, meta.total } }', () => {
    const body = { data: { data: [{ id: 3 }], meta: { total: 15 } } };
    expect(unwrapPage(body, req, map)).toMatchObject({ items: [3], total: 15 });
  });
  it('accepts { data: { items, pagination.total } }', () => {
    const body = { data: { items: [{ id: 3 }], pagination: { total: 20 } } };
    expect(unwrapPage(body, req, map).total).toBe(20);
  });
  it('accepts { items, total }', () => {
    expect(unwrapPage({ items: [{ id: 4 }], total: 30 }, req, map)).toMatchObject({
      items: [4],
      total: 30,
    });
  });
  it('accepts string totals with commas', () => {
    const body = { data: [{ id: 1 }], meta: { total: '1,240' } };
    expect(unwrapPage(body, req, map).total).toBe(1240);
  });
  it('falls back to the item count when no total is present', () => {
    expect(unwrapPage({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] }, req, map).total).toBe(3);
  });
  it('returns an empty page for invalid input', () => {
    for (const bad of [null, undefined, 'x', 5, {}, { data: null }, { data: 'x' }]) {
      expect(unwrapPage(bad, req, map)).toEqual({ items: [], page: 2, pageSize: 10, total: 0 });
    }
  });
});

describe('toNum', () => {
  it('parses numbers and numeric strings', () => {
    expect(toNum(1500)).toBe(1500);
    expect(toNum('1500')).toBe(1500);
    expect(toNum('1500.00')).toBe(1500);
    expect(toNum('1,500')).toBe(1500);
    expect(toNum(' 5,000,000,000 ')).toBe(5000000000);
    expect(toNum('-2.5')).toBe(-2.5);
    expect(toNum(0)).toBe(0);
    expect(toNum('0')).toBe(0);
    expect(toNum(BigInt(42))).toBe(42);
  });
  it('returns null for invalid input', () => {
    for (const bad of ['', '  ', null, undefined, NaN, Infinity, 'abc', '12abc', {}, [], true]) {
      expect(toNum(bad)).toBeNull();
    }
  });
});

describe('toStr', () => {
  it('trims strings', () => {
    expect(toStr('  hi ')).toBe('hi');
  });
  it('maps empty and blank strings to null', () => {
    expect(toStr('')).toBeNull();
    expect(toStr('   ')).toBeNull();
  });
  it('stringifies numbers and rejects other types', () => {
    expect(toStr(5)).toBe('5');
    expect(toStr(null)).toBeNull();
    expect(toStr(undefined)).toBeNull();
    expect(toStr({})).toBeNull();
    expect(toStr(NaN)).toBeNull();
  });
});

describe('toIsoDate', () => {
  it('cuts ISO timestamps to the date part', () => {
    expect(toIsoDate('2026-01-15T00:00:00.000Z')).toBe('2026-01-15');
    expect(toIsoDate('2026-01-15')).toBe('2026-01-15');
  });
  it('accepts Date objects', () => {
    expect(toIsoDate(new Date('2026-03-04T10:00:00.000Z'))).toBe('2026-03-04');
  });
  it('returns null for invalid input', () => {
    for (const bad of ['', 'nope', null, undefined, 5, {}, new Date('x')]) {
      expect(toIsoDate(bad)).toBeNull();
    }
  });
});
