import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { gcService } from '../api/gc.service';
import { gcMockDb } from '../mocks/gc.mock';
import { DEFAULT_GC_QUERY, parseGcListQuery, serializeGcListQuery } from './gc-list-query';
import { useGcListStore } from './gc-list.store';

describe('gc list query codec', () => {
  it('parses valid params and ignores bad ones', () => {
    const q = parseGcListQuery(
      new URLSearchParams('q=%20abc%20&status=EXPIRED&contractTypeId=3&page=2&pageSize=20&sort=title'),
    );
    expect(q).toEqual({ q: 'abc', status: 'EXPIRED', contractTypeId: 3, page: 2, pageSize: 20 });
    expect(parseGcListQuery(new URLSearchParams('status=nope&contractTypeId=x&page=0&pageSize=7'))).toEqual(
      DEFAULT_GC_QUERY,
    );
  });
  it('serializes only non-defaults and never sorts', () => {
    expect(serializeGcListQuery(DEFAULT_GC_QUERY)).toBe('');
    expect(serializeGcListQuery({ ...DEFAULT_GC_QUERY, q: 'x', status: 'ACTIVE', contractTypeId: 2, page: 3, pageSize: 50 })).toBe(
      'q=x&status=ACTIVE&contractTypeId=2&page=3&pageSize=50',
    );
  });
});

beforeEach(() => {
  vi.restoreAllMocks();
  installMocks(api, { delay: 0 });
  clearMockSession();
  setMockSession('gc.editor', false);
  gcMockDb.reset(new Date());
  useGcListStore.getState().reset();
});

describe('useGcListStore', () => {
  it('fetches with the current query; setQuery resets page unless given', async () => {
    const spy = vi.spyOn(gcService, 'list');
    const s = useGcListStore.getState();
    s.setQuery({ pageSize: 10, page: 2 });
    s.setQuery({ status: 'EXPIRED' });
    expect(useGcListStore.getState().query.page).toBe(1);
    await s.fetch();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ status: 'EXPIRED', page: 1 }));
    const st = useGcListStore.getState();
    expect(st.status).toBe('ready');
    expect(st.total).toBe(gcMockDb.all().filter((c) => c.status === 'EXPIRED').length);
    expect(st.items.every((c) => c.status === 'EXPIRED')).toBe(true);
  });

  it('sets error state on failure and resets on reset()', async () => {
    clearMockSession();
    await useGcListStore.getState().fetch();
    expect(useGcListStore.getState().status).toBe('error');
    useGcListStore.getState().reset();
    expect(useGcListStore.getState().status).toBe('idle');
  });

  it('afterDelete steps back a page when the last page empties', async () => {
    const total = gcMockDb.all().length;
    const size = 10;
    const lastPage = Math.ceil(total / size);
    // make the last page hold exactly one row, then delete it
    while (total - (lastPage - 1) * size > 1) {
      gcMockDb.remove(gcMockDb.all()[gcMockDb.all().length - 1].id);
      if (gcMockDb.all().length - (lastPage - 1) * size <= 1) break;
    }
    useGcListStore.getState().replaceQuery({ ...DEFAULT_GC_QUERY, page: lastPage });
    await useGcListStore.getState().fetch();
    const only = useGcListStore.getState().items;
    expect(only.length).toBe(1);
    await gcService.remove(only[0].id);
    await useGcListStore.getState().afterDelete();
    expect(useGcListStore.getState().query.page).toBe(lastPage - 1);
    expect(useGcListStore.getState().items.length).toBe(size);
  });
});
