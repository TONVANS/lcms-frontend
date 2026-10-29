import { describe, expect, it } from 'vitest';
import { createQueryCodec, type ListQueryBase } from './list-query-codec';

interface Q extends ListQueryBase {
  kind?: 'a' | 'b';
  year?: number;
  ref?: string;
  from?: string;
}

const PAGE_SIZES = [10, 25, 50] as const;
const codec = createQueryCodec<Q>({
  defaults: { page: 1, pageSize: 10 },
  enums: { kind: ['a', 'b'] },
  ints: ['year'],
  strings: { ref: /^[\w-]{1,40}$/, from: /^\d{4}-\d{2}-\d{2}$/ },
  pageSizes: PAGE_SIZES,
});
const D = codec.defaults;
const parse = (s: string) => codec.parse(new URLSearchParams(s));

describe('list query codec', () => {
  it('falls back to defaults for every invalid value', () => {
    expect(parse('kind=x&year=abc&ref=a%20b&from=2026-13&page=-3&pageSize=999&sort=evil')).toEqual(D);
  });

  it('parses valid values and ignores sort/order entirely', () => {
    expect(parse('q=edl&kind=b&year=2026&ref=dep-1&from=2026-01-31&page=2&pageSize=25&sort=x&order=asc')).toEqual({
      q: 'edl',
      kind: 'b',
      year: 2026,
      ref: 'dep-1',
      from: '2026-01-31',
      page: 2,
      pageSize: 25,
    });
  });

  it('accepts only listed page sizes and positive safe integer pages', () => {
    for (const n of PAGE_SIZES) expect(parse(`pageSize=${n}`).pageSize).toBe(n);
    expect(parse('pageSize=15').pageSize).toBe(10);
    expect(parse('pageSize=all').pageSize).toBe(10);
    expect(parse('page=1.5').page).toBe(1);
    expect(parse('page=0').page).toBe(1);
    expect(parse('page=1000000000000000000000').page).toBe(1);
  });

  it('trims q and drops blank q', () => {
    expect(parse('q=%20%20').q).toBeUndefined();
    expect(parse('q=%20edl%20').q).toBe('edl');
    expect(codec.serialize({ ...D, q: '   ' })).toBe('');
    expect(codec.serialize({ ...D, q: ' edl ' })).toBe('q=edl');
  });

  it('serializes without defaults and without sort keys', () => {
    expect(codec.serialize(D)).toBe('');
    expect(codec.serialize({ ...D, kind: 'a', year: 2025, pageSize: 50 })).toBe('kind=a&year=2025&pageSize=50');
  });

  it('round-trips', () => {
    const q: Q = { ...D, q: 'a b', kind: 'b', year: 1999, ref: 'x-1', from: '2026-02-03', page: 4 };
    expect(parse(codec.serialize(q))).toEqual(q);
  });
});
