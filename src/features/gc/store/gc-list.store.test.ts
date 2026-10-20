import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runLogoutResets } from '@/lib/auth/logout-registry';
import type { Paginated } from '@/types/api';
import { gcService } from '../api/gc.service';
import type { GeneralContract } from '../types';
import { DEFAULT_GC_QUERY } from './gc-list-query';
import { useGcListStore } from './gc-list.store';

const s = useGcListStore;

const mk = (id: string): GeneralContract => ({
  id,
  title: id,
  type: 'epc',
  contractNo: id,
  counterparty: null,
  termText: null,
  signedDate: '2026-01-01',
  effectiveDate: '2026-01-01',
  endDate: null,
  value: null,
  equity: null,
  implementer: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  createdBy: 'u',
});

const pageOf = (
  items: GeneralContract[],
  page = 1,
  total = items.length,
): Paginated<GeneralContract> => ({ items, page, pageSize: 10, total });

beforeEach(() => {
  vi.restoreAllMocks();
  s.getState().reset();
});

describe('gc list store', () => {
  it('setQuery resets page unless given', () => {
    s.getState().setQuery({ page: 3 });
    s.getState().setQuery({ q: 'x' });
    expect(s.getState().query.page).toBe(1);
    expect(s.getState().query.q).toBe('x');
    s.getState().setQuery({ page: 2, status: 'active' });
    expect(s.getState().query.page).toBe(2);
  });

  it('replaceQuery replaces rather than patches', () => {
    s.getState().setQuery({ q: 'old', status: 'expired' });
    s.getState().replaceQuery({ ...DEFAULT_GC_QUERY, type: 'moa' });
    expect(s.getState().query).toEqual({ ...DEFAULT_GC_QUERY, type: 'moa' });
  });

  it('fetch stores items and total from the response', async () => {
    vi.spyOn(gcService, 'list').mockResolvedValue(pageOf([mk('a')], 1, 41));
    await s.getState().fetch();
    expect(s.getState().status).toBe('ready');
    expect(s.getState().total).toBe(41);
    expect(s.getState().items).toHaveLength(1);
  });

  it('drops a stale response after reset', async () => {
    let resolve!: (v: Paginated<GeneralContract>) => void;
    vi.spyOn(gcService, 'list').mockReturnValue(new Promise((r) => (resolve = r)));
    const p = s.getState().fetch();
    s.getState().reset();
    resolve(pageOf([mk('a')]));
    await p;
    expect(s.getState().items).toEqual([]);
    expect(s.getState().status).toBe('idle');
  });

  it('drops an older response that resolves after a newer fetch', async () => {
    const resolvers: ((v: Paginated<GeneralContract>) => void)[] = [];
    vi.spyOn(gcService, 'list').mockImplementation(
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
    vi.spyOn(gcService, 'list').mockRejectedValue(new Error('boom'));
    await s.getState().fetch();
    expect(s.getState().status).toBe('error');
    expect(s.getState().error).not.toBeNull();
    expect(typeof s.getState().error?.code).toBe('string');
  });

  it('leaves state unchanged on a canceled request', async () => {
    s.setState({ items: [mk('keep')], status: 'ready', total: 1 });
    vi.spyOn(gcService, 'list').mockRejectedValue(
      new AxiosError('canceled', AxiosError.ERR_CANCELED),
    );
    await s.getState().fetch();
    expect(s.getState().items).toHaveLength(1);
    expect(s.getState().error).toBeNull();
    expect(s.getState().status).not.toBe('error');
  });

  it('afterDelete steps back when the last page empties', async () => {
    s.getState().setQuery({ page: 3 });
    const ten = Array.from({ length: 10 }, (_, i) => mk(`p2-${i}`));
    vi.spyOn(gcService, 'list').mockImplementation(async (q) =>
      q?.page === 3 ? pageOf([], 3, 20) : pageOf(ten, 2, 20),
    );
    await s.getState().afterDelete();
    expect(s.getState().query.page).toBe(2);
    expect(s.getState().items).toHaveLength(10);
  });

  it('afterDelete stays on page 1 when empty', async () => {
    vi.spyOn(gcService, 'list').mockResolvedValue(pageOf([], 1, 0));
    await s.getState().afterDelete();
    expect(s.getState().query.page).toBe(1);
  });

  it('is cleared by logout resets', () => {
    s.setState({ items: [mk('x')] });
    s.getState().setQuery({ q: 'x' });
    runLogoutResets();
    expect(s.getState().items).toEqual([]);
    expect(s.getState().query).toEqual(DEFAULT_GC_QUERY);
  });
});
