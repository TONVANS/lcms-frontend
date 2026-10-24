import { describe, expect, it } from 'vitest';
import { LEGAL_PAGE_SIZES } from '../constants';
import { regulationsQueryCodec as codec } from '../regulations/store/regulations-list.store';
import type { RegulationListQuery } from '../regulations/api/regulations.service';

const D = codec.defaults as RegulationListQuery;
const parse = (s: string) => codec.parse(new URLSearchParams(s));

describe('list query codec (regulations)', () => {
  it('falls back to defaults for every invalid value', () => {
    expect(parse('status=bogus&type=x&unit=nope&page=-3&pageSize=999&sort=evil&order=up')).toEqual(
      D,
    );
  });

  it('parses valid values', () => {
    expect(
      parse('q=edl&type=rule&unit=ict&status=repealed&page=2&pageSize=25&sort=title&order=asc'),
    ).toEqual({
      q: 'edl',
      type: 'rule',
      unit: 'ict',
      status: 'repealed',
      page: 2,
      pageSize: 25,
      sort: 'title',
      order: 'asc',
    });
  });

  it('parse ignores unknown enum values and non-listed page sizes', () => {
    const r = parse('type=bogus&unit=mars&status=gone&pageSize=7&page=0');
    expect(r).toEqual(D);
    expect(r.type).toBeUndefined();
    expect(r.unit).toBeUndefined();
    expect(r.status).toBeUndefined();
    expect(parse('pageSize=all').pageSize).toBe(10);
  });

  it('accepts every shared page size and rejects others', () => {
    for (const n of LEGAL_PAGE_SIZES) {
      expect(parse(`pageSize=${n}`).pageSize).toBe(n);
    }
    expect(parse('pageSize=15').pageSize).toBe(10);
    expect(parse('page=1.5').page).toBe(1);
    expect(parse('page=0').page).toBe(1);
    expect(parse('page=-1').page).toBe(1);
    expect(parse('page=1000000000000000000000').page).toBe(1);
  });

  it('trims q and drops empty or whitespace-only q', () => {
    expect(parse('q=%20%20').q).toBeUndefined();
    expect(parse('q=%20edl%20').q).toBe('edl');
    expect(codec.serialize({ ...D, q: '   ' })).toBe('');
    expect(codec.serialize({ ...D, q: ' edl ' })).toBe('q=edl');
  });

  it('serializes without defaults', () => {
    expect(codec.serialize(D)).toBe('');
    expect(codec.serialize({ ...D, status: 'repealed' })).toBe('status=repealed');
  });

  it('serialize omits defaults and blank q', () => {
    expect(codec.serialize({ ...D, q: '  ', page: 1, pageSize: 10, order: 'desc' })).toBe('');
    expect(codec.serialize({ ...D, pageSize: 50, sort: 'number', order: 'asc' })).toBe(
      'pageSize=50&sort=number&order=asc',
    );
  });

  it('never writes pageSize=all', () => {
    expect(codec.serialize({ ...D, pageSize: 'all' })).toBe('');
  });

  it('round-trips', () => {
    const q: RegulationListQuery = {
      ...D,
      q: 'a b',
      type: 'notice',
      unit: 'grid_north',
      page: 4,
      order: 'asc',
    };
    expect(parse(codec.serialize(q))).toEqual(q);
  });
});
