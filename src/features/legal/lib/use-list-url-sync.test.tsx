import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { regulationsService } from '../regulations/api/regulations.service';
import {
  regulationsQueryCodec as codec,
  useRegulationsListStore as store,
  useRegulationsListUrlSync,
} from '../regulations/store/regulations-list.store';
import { useListUrlSync } from './use-list-url-sync';

const nav = vi.hoisted(() => ({ search: '', replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => '/legal/regulations',
  useSearchParams: () => new URLSearchParams(nav.search),
}));

let list: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.restoreAllMocks();
  nav.search = '';
  nav.replace = vi.fn();
  store.getState().reset();
  list = vi
    .spyOn(regulationsService, 'list')
    .mockResolvedValue({ items: [], page: 1, pageSize: 10, total: 0 });
});

describe('useListUrlSync (regulations)', () => {
  it('does not wipe incoming params on mount and fetches once with them', async () => {
    nav.search = 'status=repealed&page=2';
    await act(async () => {
      renderHook(() => useRegulationsListUrlSync());
    });
    expect(nav.replace).not.toHaveBeenCalled();
    expect(list).toHaveBeenCalledTimes(1);
    expect(list.mock.calls[0]![0]).toMatchObject({ status: 'repealed', page: 2 });
  });

  it('mount parse replaces a stale store query', async () => {
    store.getState().setQuery({ q: 'old', status: 'repealed' });
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
      store.getState().setQuery({ status: 'repealed' });
    });
    expect(nav.replace).toHaveBeenCalledWith('/legal/regulations?status=repealed', {
      scroll: false,
    });
    expect(list).toHaveBeenCalledTimes(1);
    expect(list.mock.calls[0]![0]).toMatchObject({ status: 'repealed' });
  });

  it('re-parses on back/forward without looping', async () => {
    nav.search = 'status=repealed';
    const { rerender } = renderHook(() => useListUrlSync(store, codec));
    await act(async () => {});
    list.mockClear();
    nav.replace.mockClear();

    nav.search = 'type=rule&page=3';
    await act(async () => {
      rerender();
    });
    expect(store.getState().query).toEqual({ ...codec.defaults, type: 'rule', page: 3 });
    expect(list).toHaveBeenCalledTimes(1);
    expect(nav.replace).not.toHaveBeenCalled();

    // The echo of our own replace through useSearchParams is skipped.
    list.mockClear();
    await act(async () => {
      store.getState().setQuery({ status: 'in_force' });
    });
    expect(list).toHaveBeenCalledTimes(1);
    nav.search = 'type=rule&status=in_force';
    await act(async () => {
      rerender();
    });
    expect(list).toHaveBeenCalledTimes(1);
    expect(store.getState().query.status).toBe('in_force');
  });

  it('under StrictMode never replaces and fetches once', async () => {
    nav.search = 'status=repealed&page=2';
    await act(async () => {
      renderHook(() => useListUrlSync(store, codec), { wrapper: StrictMode });
    });
    expect(nav.replace).not.toHaveBeenCalled();
    expect(list).toHaveBeenCalledTimes(1);
    expect(list.mock.calls[0]![0]).toMatchObject({ status: 'repealed', page: 2 });
  });

  it('only ignores the echo of the last push; a later external navigation is adopted', async () => {
    const { rerender } = renderHook(() => useListUrlSync(store, codec));
    await act(async () => {});
    await act(async () => {
      store.getState().setQuery({ status: 'in_force' });
    });
    await act(async () => {
      store.getState().setQuery({ status: 'repealed' });
    });
    nav.search = 'status=repealed';
    await act(async () => {
      rerender();
    });
    nav.search = 'status=in_force';
    await act(async () => {
      rerender();
    });
    expect(store.getState().query.status).toBe('in_force');
  });

  it('afterDelete steps back a page and updates the URL', async () => {
    nav.search = 'page=3';
    const ten = Array.from({ length: 10 }, (_, i) => ({ id: `p2-${i}` }) as never);
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
    expect(nav.replace).toHaveBeenCalledWith('/legal/regulations?page=2', { scroll: false });
  });

  it('ignores late echoes of earlier pushes so the latest query is not rolled back', async () => {
    const { rerender } = renderHook(() => useListUrlSync(store, codec));
    await act(async () => {});
    await act(async () => {
      store.getState().setQuery({ status: 'in_force' });
    });
    await act(async () => {
      store.getState().setQuery({ status: 'repealed' });
    });
    const fetchesAfterPushes = list.mock.calls.length;
    nav.search = 'status=in_force';
    await act(async () => {
      rerender();
    });
    nav.search = 'status=repealed';
    await act(async () => {
      rerender();
    });
    expect(store.getState().query.status).toBe('repealed');
    expect(list).toHaveBeenCalledTimes(fetchesAfterPushes);
    expect(nav.replace).toHaveBeenLastCalledWith('/legal/regulations?status=repealed', {
      scroll: false,
    });
  });
});
