import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gcService } from '../api/gc.service';
import { DEFAULT_GC_QUERY } from '../store/gc-list-query';
import { useGcListStore } from '../store/gc-list.store';
import { useGcListUrlSync } from './use-gc-list-url-sync';

const nav = vi.hoisted(() => ({ search: '', replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => '/contracts/list',
  useSearchParams: () => new URLSearchParams(nav.search),
}));

let list: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.restoreAllMocks();
  nav.search = '';
  nav.replace = vi.fn();
  useGcListStore.getState().reset();
  list = vi
    .spyOn(gcService, 'list')
    .mockResolvedValue({ items: [], page: 1, pageSize: 10, total: 0 });
});

describe('useGcListUrlSync', () => {
  it('does not wipe incoming params on mount and fetches once with them', async () => {
    nav.search = 'status=expired&page=2';
    await act(async () => {
      renderHook(() => useGcListUrlSync());
    });
    for (const call of nav.replace.mock.calls) {
      expect(call[0]).toBe('/contracts/list?status=expired&page=2');
    }
    expect(list).toHaveBeenCalledTimes(1);
    expect(list.mock.calls[0]![0]).toMatchObject({ status: 'expired', page: 2 });
  });

  it('mount parse replaces a stale store query', async () => {
    useGcListStore.getState().setQuery({ q: 'old', status: 'active' });
    await act(async () => {
      renderHook(() => useGcListUrlSync());
    });
    expect(useGcListStore.getState().query).toEqual(DEFAULT_GC_QUERY);
  });

  it('pushes store changes to the URL and fetches', async () => {
    await act(async () => {
      renderHook(() => useGcListUrlSync());
    });
    list.mockClear();
    await act(async () => {
      useGcListStore.getState().setQuery({ status: 'expiring' });
    });
    expect(nav.replace).toHaveBeenCalledWith('/contracts/list?status=expiring', {
      scroll: false,
    });
    expect(list).toHaveBeenCalledTimes(1);
    expect(list.mock.calls[0]![0]).toMatchObject({ status: 'expiring' });
  });

  it('re-parses on back/forward without looping', async () => {
    nav.search = 'status=expired';
    const { rerender } = renderHook(() => useGcListUrlSync());
    await act(async () => {});
    list.mockClear();
    nav.replace.mockClear();

    nav.search = 'type=epc&page=3';
    await act(async () => {
      rerender();
    });
    expect(useGcListStore.getState().query).toEqual({ ...DEFAULT_GC_QUERY, type: 'epc', page: 3 });
    expect(list).toHaveBeenCalledTimes(1);
    expect(nav.replace).not.toHaveBeenCalled();

    // The echo of our own replace through useSearchParams is skipped.
    list.mockClear();
    await act(async () => {
      useGcListStore.getState().setQuery({ status: 'active' });
    });
    expect(list).toHaveBeenCalledTimes(1);
    nav.search = 'type=epc&status=active';
    await act(async () => {
      rerender();
    });
    expect(list).toHaveBeenCalledTimes(1);
    expect(useGcListStore.getState().query.status).toBe('active');
  });
});
