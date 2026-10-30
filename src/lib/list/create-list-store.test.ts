import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runLogoutResets } from '@/lib/auth/logout-registry';
import type { Paginated } from '@/types/api';
import { createListStore } from './create-list-store';
import type { ListQueryBase } from './list-query-codec';

interface Item {
  id: string;
  name: string;
}

interface Query extends ListQueryBase {
  category?: string;
  status?: string;
}

const DEFAULTS: Query = { page: 1, pageSize: 10 };

const mk = (id: string): Item => ({
  id,
  name: `Item ${id}`,
});

const pageOf = (items: Item[], page = 1, total = items.length): Paginated<Item> => ({
  items,
  page,
  pageSize: 10,
  total,
});

describe('createListStore (generic factory)', () => {
  let fetchFn: ReturnType<typeof vi.fn<(q: Query) => Promise<Paginated<Item>>>>;
  let useStore: ReturnType<typeof createListStore<Item, Query>>;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchFn = vi.fn<(q: Query) => Promise<Paginated<Item>>>().mockResolvedValue(pageOf([]));
    useStore = createListStore<Item, Query>(fetchFn, DEFAULTS);
  });

  it('setQuery resets page unless given', () => {
    useStore.getState().setQuery({ page: 3 });
    useStore.getState().setQuery({ q: 'x' });
    expect(useStore.getState().query.page).toBe(1);
    expect(useStore.getState().query.q).toBe('x');
    useStore.getState().setQuery({ page: 2, status: 'INACTIVE' });
    expect(useStore.getState().query.page).toBe(2);
  });

  it('replaceQuery replaces rather than patches', () => {
    useStore.getState().setQuery({ q: 'old', status: 'INACTIVE' });
    useStore.getState().replaceQuery({ ...DEFAULTS, category: 'MANUAL' });
    expect(useStore.getState().query).toEqual({ ...DEFAULTS, category: 'MANUAL' });
  });

  it('fetch stores items and total from the response', async () => {
    fetchFn.mockResolvedValue(pageOf([mk('a')], 1, 41));
    await useStore.getState().fetch();
    expect(useStore.getState().status).toBe('ready');
    expect(useStore.getState().total).toBe(41);
    expect(useStore.getState().items).toHaveLength(1);
  });

  it('drops a stale response after reset', async () => {
    let resolve!: (v: Paginated<Item>) => void;
    fetchFn.mockReturnValue(new Promise((r) => (resolve = r)));
    const p = useStore.getState().fetch();
    useStore.getState().reset();
    resolve(pageOf([mk('a')]));
    await p;
    expect(useStore.getState().items).toEqual([]);
    expect(useStore.getState().status).toBe('idle');
  });

  it('drops an older response that resolves after a newer fetch', async () => {
    const resolvers: ((v: Paginated<Item>) => void)[] = [];
    fetchFn.mockImplementation(() => new Promise((r) => resolvers.push(r)));
    const p1 = useStore.getState().fetch();
    const p2 = useStore.getState().fetch();
    resolvers[1]!(pageOf([mk('new')]));
    resolvers[0]!(pageOf([mk('old')]));
    await Promise.all([p1, p2]);
    expect(useStore.getState().items.map((i) => i.id)).toEqual(['new']);
  });

  it('sets status error and normalized error on failure', async () => {
    fetchFn.mockRejectedValue(new Error('boom'));
    await useStore.getState().fetch();
    expect(useStore.getState().status).toBe('error');
    expect(useStore.getState().error).not.toBeNull();
    expect(typeof useStore.getState().error?.code).toBe('string');
  });

  it('leaves state unchanged on a canceled request', async () => {
    useStore.setState({ items: [mk('keep')], status: 'ready', total: 1 });
    fetchFn.mockRejectedValue(new AxiosError('canceled', AxiosError.ERR_CANCELED));
    await useStore.getState().fetch();
    expect(useStore.getState().items).toHaveLength(1);
    expect(useStore.getState().error).toBeNull();
    expect(useStore.getState().status).toBe('ready');
  });

  it('afterDelete steps back when the last page empties', async () => {
    useStore.getState().setQuery({ page: 3 });
    const ten = Array.from({ length: 10 }, (_, i) => mk(`p2-${i}`));
    fetchFn.mockImplementation(async (q) =>
      q?.page === 3 ? pageOf([], 3, 20) : pageOf(ten, 2, 20),
    );
    await useStore.getState().afterDelete();
    expect(useStore.getState().query.page).toBe(2);
    expect(useStore.getState().items).toHaveLength(10);
  });

  it('afterDelete stays on page 1 when empty', async () => {
    fetchFn.mockResolvedValue(pageOf([], 1, 0));
    await useStore.getState().afterDelete();
    expect(useStore.getState().query.page).toBe(1);
  });

  it('is cleared by logout resets', () => {
    useStore.setState({ items: [mk('x')] });
    useStore.getState().setQuery({ q: 'x' });
    runLogoutResets();
    expect(useStore.getState().items).toEqual([]);
    expect(useStore.getState().query).toEqual(DEFAULTS);
  });

  it('two stores created by the factory do not share generation or state', async () => {
    const fetchA = vi.fn().mockResolvedValue(pageOf([mk('a')]));
    const fetchB = vi.fn().mockResolvedValue(pageOf([mk('b')]));
    const a = createListStore<Item, typeof DEFAULTS>(fetchA, DEFAULTS);
    const b = createListStore<Item, typeof DEFAULTS>(fetchB, DEFAULTS);

    // A's in-flight fetch must survive a fetch and a reset on B.
    let resolveA!: (v: Paginated<Item>) => void;
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
