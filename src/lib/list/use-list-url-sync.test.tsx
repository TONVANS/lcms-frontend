import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Paginated } from '@/types/api';
import { createListStore } from './create-list-store';
import { createQueryCodec, type ListQueryBase } from './list-query-codec';
import { useListUrlSync } from './use-list-url-sync';

const nav = vi.hoisted(() => ({ search: '', replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => '/items',
  useSearchParams: () => new URLSearchParams(nav.search),
}));

interface Item {
  id: string;
}

interface Q extends ListQueryBase {
  status?: 'ACTIVE' | 'INACTIVE';
  docType?: 'MANUAL' | 'RULE';
}

const codec = createQueryCodec<Q>({
  defaults: { page: 1, pageSize: 10 },
  enums: { status: ['ACTIVE', 'INACTIVE'], docType: ['MANUAL', 'RULE'] },
  pageSizes: [10, 20, 50],
});

let list: ReturnType<typeof vi.fn<(q: Q) => Promise<Paginated<Item>>>>;
let store: ReturnType<typeof createListStore<Item, Q>>;

beforeEach(() => {
  vi.restoreAllMocks();
  nav.search = '';
  nav.replace = vi.fn();
  list = vi
    .fn<(q: Q) => Promise<Paginated<Item>>>()
    .mockResolvedValue({ items: [], page: 1, pageSize: 10, total: 0 });
  store = createListStore<Item, Q>(list, codec.defaults);
});

describe('useListUrlSync', () => {
  it('does not wipe incoming params on mount and fetches once with them', async () => {
    nav.search = 'status=INACTIVE&page=2';
    await act(async () => {
      renderHook(() => useListUrlSync(store, codec));
    });
    expect(nav.replace).not.toHaveBeenCalled();
    expect(list).toHaveBeenCalledTimes(1);
    expect(list.mock.calls[0]![0]).toMatchObject({ status: 'INACTIVE', page: 2 });
  });

  it('mount parse replaces a stale store query', async () => {
    store.getState().setQuery({ q: 'old', status: 'INACTIVE' });
    await act(async () => {
      renderHook(() => useListUrlSync(store, codec));
    });
    expect(store.getState().query).toEqual(codec.defaults);
  });

  it('pushes store changes to the URL and fetches', async () => {
    await act(async () => {
      renderHook(() => useListUrlSync(store, codec));
    });
    list.mockClear();
    await act(async () => {
      store.getState().setQuery({ status: 'INACTIVE' });
    });
    expect(nav.replace).toHaveBeenCalledWith('/items?status=INACTIVE', {
      scroll: false,
    });
    expect(list).toHaveBeenCalledTimes(1);
    expect(list.mock.calls[0]![0]).toMatchObject({ status: 'INACTIVE' });
  });

  it('re-parses on back/forward without looping', async () => {
    nav.search = 'status=INACTIVE';
    const { rerender } = renderHook(() => useListUrlSync(store, codec));
    await act(async () => {});
    list.mockClear();
    nav.replace.mockClear();

    nav.search = 'docType=MANUAL&page=3';
    await act(async () => {
      rerender();
    });
    expect(store.getState().query).toEqual({ ...codec.defaults, docType: 'MANUAL', page: 3 });
    expect(list).toHaveBeenCalledTimes(1);
    expect(nav.replace).not.toHaveBeenCalled();

    // The echo of our own replace through useSearchParams is skipped.
    list.mockClear();
    await act(async () => {
      store.getState().setQuery({ status: 'ACTIVE' });
    });
    expect(list).toHaveBeenCalledTimes(1);
    nav.search = 'docType=MANUAL&status=ACTIVE';
    await act(async () => {
      rerender();
    });
    expect(list).toHaveBeenCalledTimes(1);
    expect(store.getState().query.status).toBe('ACTIVE');
  });

  it('under StrictMode never replaces and fetches once', async () => {
    nav.search = 'status=INACTIVE&page=2';
    await act(async () => {
      renderHook(() => useListUrlSync(store, codec), { wrapper: StrictMode });
    });
    expect(nav.replace).not.toHaveBeenCalled();
    expect(list).toHaveBeenCalledTimes(1);
    expect(list.mock.calls[0]![0]).toMatchObject({ status: 'INACTIVE', page: 2 });
  });

  it('only ignores the echo of the last push; a later external navigation is adopted', async () => {
    const { rerender } = renderHook(() => useListUrlSync(store, codec));
    await act(async () => {});
    await act(async () => {
      store.getState().setQuery({ status: 'ACTIVE' });
    });
    await act(async () => {
      store.getState().setQuery({ status: 'INACTIVE' });
    });
    nav.search = 'status=INACTIVE';
    await act(async () => {
      rerender();
    });
    nav.search = 'status=ACTIVE';
    await act(async () => {
      rerender();
    });
    expect(store.getState().query.status).toBe('ACTIVE');
  });

  it('afterDelete steps back a page and updates the URL', async () => {
    nav.search = 'page=3';
    const ten = Array.from({ length: 10 }, (_, i) => ({ id: `p2-${i}` }));
    list.mockImplementation(async (q: { page?: number }) =>
      q.page === 3
        ? { items: [], page: 3, pageSize: 10, total: 20 }
        : { items: ten, page: 2, pageSize: 10, total: 20 },
    );
    renderHook(() => useListUrlSync(store, codec));
    await act(async () => {});
    await act(async () => {
      await store.getState().afterDelete();
    });
    const st = store.getState();
    expect(st.query.page).toBe(2);
    expect(st.items).toHaveLength(10);
    expect(st.status).toBe('ready');
    expect(nav.replace).toHaveBeenCalledWith('/items?page=2', { scroll: false });
  });

  it('ignores late echoes of earlier pushes so the latest query is not rolled back', async () => {
    const { rerender } = renderHook(() => useListUrlSync(store, codec));
    await act(async () => {});
    await act(async () => {
      store.getState().setQuery({ status: 'ACTIVE' });
    });
    await act(async () => {
      store.getState().setQuery({ status: 'INACTIVE' });
    });
    const fetchesAfterPushes = list.mock.calls.length;
    nav.search = 'status=ACTIVE';
    await act(async () => {
      rerender();
    });
    nav.search = 'status=INACTIVE';
    await act(async () => {
      rerender();
    });
    expect(store.getState().query.status).toBe('INACTIVE');
    expect(list).toHaveBeenCalledTimes(fetchesAfterPushes);
    expect(nav.replace).toHaveBeenLastCalledWith('/items?status=INACTIVE', {
      scroll: false,
    });
  });
});
