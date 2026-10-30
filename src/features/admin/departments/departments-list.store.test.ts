import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { adminMockDb } from '../mocks/admin.mock';
import {
  departmentsQueryCodec as codec,
  useDepartmentsListStore as store,
} from './departments-list.store';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  adminMockDb.reset();
  store.getState().reset();
});

describe('departments list store', () => {
  it('codec carries search, filter, page and pageSize through URL', () => {
    const q = codec.parse(
      new URLSearchParams('q=Tech&filter=inactive&page=3&pageSize=10&sort=x'),
    );
    expect(q).toEqual({
      page: 3,
      pageSize: 10,
      q: 'Tech',
      filter: 'inactive',
    });
    expect(codec.parse(new URLSearchParams(codec.serialize(q)))).toEqual(q);
  });

  it('fetches and slices client-side pages with total from full list', async () => {
    setMockSession('admin', false);
    store.getState().setQuery({ pageSize: 10, page: 1 });
    await store.getState().fetch();
    const s = store.getState();
    expect(s.status).toBe('ready');
    expect(s.total).toBe(adminMockDb.departments().length);
    expect(s.items.length).toBe(Math.min(10, s.total));
  });
});

