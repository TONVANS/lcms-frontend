import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runLogoutResets } from '@/lib/auth/logout-registry';
import type { Paginated } from '@/types/api';
import { regulationsService } from '../regulations/api/regulations.service';
import {
  regulationsQueryCodec,
  useRegulationsListStore as s,
} from '../regulations/store/regulations-list.store';
import type { Regulation } from '../regulations/types';
import { createListStore } from './create-list-store';

const DEFAULTS = regulationsQueryCodec.defaults;

const mk = (id: string): Regulation => ({
  id,
  title: id,
  type: 'decision',
  typeOther: null,
  number: id,
  issuedDate: '2026-01-01',
  year: 2026,
  purpose: null,
  responsible: null,
  unit: 'ict',
  status: 'in_force',
  externalLinks: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  createdBy: 'u',
});

const pageOf = (items: Regulation[], page = 1, total = items.length): Paginated<Regulation> => ({
  items,
  page,
  pageSize: 10,
  total,
});

beforeEach(() => {
  vi.restoreAllMocks();
  s.getState().reset();
});

describe('regulations list store (generic factory)', () => {
  it('setQuery resets page unless given', () => {
    s.getState().setQuery({ page: 3 });
    s.getState().setQuery({ q: 'x' });
    expect(s.getState().query.page).toBe(1);
    expect(s.getState().query.q).toBe('x');
    s.getState().setQuery({ page: 2, status: 'repealed' });
    expect(s.getState().query.page).toBe(2);
  });

  it('replaceQuery replaces rather than patches', () => {
    s.getState().setQuery({ q: 'old', status: 'repealed' });
    s.getState().replaceQuery({ ...DEFAULTS, type: 'rule' });
    expect(s.getState().query).toEqual({ ...DEFAULTS, type: 'rule' });
  });

  it('fetch stores items and total from the response', async () => {
    vi.spyOn(regulationsService, 'list').mockResolvedValue(pageOf([mk('a')], 1, 41));
    await s.getState().fetch();
    expect(s.getState().status).toBe('ready');
    expect(s.getState().total).toBe(41);
    expect(s.getState().items).toHaveLength(1);
  });

  it('drops a stale response after reset', async () => {
    let resolve!: (v: Paginated<Regulation>) => void;
    vi.spyOn(regulationsService, 'list').mockReturnValue(new Promise((r) => (resolve = r)));
    const p = s.getState().fetch();
    s.getState().reset();
    resolve(pageOf([mk('a')]));
    await p;
    expect(s.getState().items).toEqual([]);
    expect(s.getState().status).toBe('idle');
  });

  it('drops an older response that resolves after a newer fetch', async () => {
    const resolvers: ((v: Paginated<Regulation>) => void)[] = [];
    vi.spyOn(regulationsService, 'list').mockImplementation(
      () => new Promise((r) => resolvers.push(r)),
    );
    const p1 = s.getState().fetch();
    const p2 = s.getState().fetch();
    resolvers[1]!(pageOf([mk('new')]));
    resolvers[0]!(pageOf([mk('old')]));
    await Promise.all([p1, p2]);
    expect(s.getState().items.map((i) => i.id)).toEqual(['new']);
  });

  it('sets status error and normalized error on failure', async () => {
    vi.spyOn(regulationsService, 'list').mockRejectedValue(new Error('boom'));
    await s.getState().fetch();
    expect(s.getState().status).toBe('error');
    expect(s.getState().error).not.toBeNull();
    expect(typeof s.getState().error?.code).toBe('string');
  });

  it('leaves state unchanged on a canceled request', async () => {
    s.setState({ items: [mk('keep')], status: 'ready', total: 1 });
    vi.spyOn(regulationsService, 'list').mockRejectedValue(
      new AxiosError('canceled', AxiosError.ERR_CANCELED),
    );
    await s.getState().fetch();
    expect(s.getState().items).toHaveLength(1);
    expect(s.getState().error).toBeNull();
    expect(s.getState().status).toBe('ready');
  });

  it('afterDelete steps back when the last page empties', async () => {
    s.getState().setQuery({ page: 3 });
    const ten = Array.from({ length: 10 }, (_, i) => mk(`p2-${i}`));
    vi.spyOn(regulationsService, 'list').mockImplementation(async (q) =>
      q?.page === 3 ? pageOf([], 3, 20) : pageOf(ten, 2, 20),
    );
    await s.getState().afterDelete();
    expect(s.getState().query.page).toBe(2);
    expect(s.getState().items).toHaveLength(10);
  });

  it('afterDelete stays on page 1 when empty', async () => {
    vi.spyOn(regulationsService, 'list').mockResolvedValue(pageOf([], 1, 0));
    await s.getState().afterDelete();
    expect(s.getState().query.page).toBe(1);
  });

  it('is cleared by logout resets', () => {
    s.setState({ items: [mk('x')] });
    s.getState().setQuery({ q: 'x' });
    runLogoutResets();
    expect(s.getState().items).toEqual([]);
    expect(s.getState().query).toEqual(DEFAULTS);
  });

  it('two stores created by the factory do not share generation or state', async () => {
    const fetchA = vi.fn().mockResolvedValue(pageOf([mk('a')]));
    const fetchB = vi.fn().mockResolvedValue(pageOf([mk('b')]));
    const a = createListStore<Regulation, typeof DEFAULTS>(fetchA, DEFAULTS);
    const b = createListStore<Regulation, typeof DEFAULTS>(fetchB, DEFAULTS);

    // A's in-flight fetch must survive a fetch and a reset on B.
    let resolveA!: (v: Paginated<Regulation>) => void;
    fetchA.mockReturnValueOnce(new Promise((r) => (resolveA = r)));
    const pa = a.getState().fetch();
    await b.getState().fetch();
    b.getState().reset();
    b.getState().setQuery({ q: 'only-b' });
    resolveA(pageOf([mk('a')]));
    await pa;

    expect(a.getState().items.map((i) => i.id)).toEqual(['a']);
    expect(a.getState().status).toBe('ready');
    expect(a.getState().query.q).toBeUndefined();
    expect(b.getState().query.q).toBe('only-b');
    expect(b.getState().items).toEqual([]);
  });
});
