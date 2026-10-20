import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GC_QUERY,
  GC_PAGE_SIZES,
  parseGcListQuery,
  serializeGcListQuery,
} from './gc-list-query';

describe('gc list query', () => {
  it('falls back to defaults for every invalid value', () => {
    expect(
      parseGcListQuery(
        new URLSearchParams('status=bogus&type=x&page=-3&pageSize=999&sort=evil&order=up'),
      ),
    ).toEqual(DEFAULT_GC_QUERY);
  });

  it('parses valid values', () => {
    expect(
      parseGcListQuery(
        new URLSearchParams(
          'q=edl&type=epc&status=expired&page=2&pageSize=20&sort=title&order=desc',
        ),
      ),
    ).toEqual({
      q: 'edl',
      type: 'epc',
      status: 'expired',
      page: 2,
      pageSize: 20,
      sort: 'title',
      order: 'desc',
    });
  });

  it('accepts exactly the page sizes the handler accepts', () => {
    for (const n of GC_PAGE_SIZES) {
      expect(parseGcListQuery(new URLSearchParams(`pageSize=${n}`)).pageSize).toBe(n);
    }
    expect(parseGcListQuery(new URLSearchParams('pageSize=15')).pageSize).toBe(10);
    expect(parseGcListQuery(new URLSearchParams('page=1.5')).page).toBe(1);
    expect(parseGcListQuery(new URLSearchParams('page=0')).page).toBe(1);
  });

  it('trims q and drops empty or whitespace-only q', () => {
    expect(parseGcListQuery(new URLSearchParams('q=%20%20')).q).toBeUndefined();
    expect(parseGcListQuery(new URLSearchParams('q=%20edl%20')).q).toBe('edl');
    expect(serializeGcListQuery({ ...DEFAULT_GC_QUERY, q: '   ' })).toBe('');
    expect(serializeGcListQuery({ ...DEFAULT_GC_QUERY, q: ' edl ' })).toBe('q=edl');
  });

  it('serializes without defaults', () => {
    expect(serializeGcListQuery(DEFAULT_GC_QUERY)).toBe('');
    expect(serializeGcListQuery({ ...DEFAULT_GC_QUERY, status: 'expiring' })).toBe(
      'status=expiring',
    );
  });

  it('round-trips', () => {
    const q = {
      ...DEFAULT_GC_QUERY,
      q: 'a b',
      type: 'moa' as const,
      page: 4,
      order: 'desc' as const,
    };
    expect(parseGcListQuery(new URLSearchParams(serializeGcListQuery(q)))).toEqual(q);
  });
});
