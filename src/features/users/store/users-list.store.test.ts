import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { usersMockDb } from '../mocks/users.mock';
import { usersQueryCodec as codec, useUsersListStore as store } from './users-list.store';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  usersMockDb.reset();
  store.getState().reset();
});

describe('users list store', () => {
  it('codec carries role, isActive, page, and pageSize through the URL', () => {
    const q = codec.parse(
      new URLSearchParams('role=EDITOR&isActive=true&q=John&page=2&pageSize=20&sort=x'),
    );
    expect(q).toEqual({
      page: 2,
      pageSize: 20,
      role: 'EDITOR',
      isActive: true,
      q: 'John',
    });
    expect(parseRoundTrip(q)).toEqual(q);
  });

  it('codec handles isActive=false', () => {
    const q = codec.parse(new URLSearchParams('isActive=false'));
    expect(q.isActive).toBe(false);
  });

  it('fetches a filtered page through the service', async () => {
    setMockSession('admin', false);
    store.getState().setQuery({ role: 'ADMIN' });
    await store.getState().fetch();
    const s = store.getState();
    expect(s.status).toBe('ready');
    expect(s.items.length).toBeGreaterThan(0);
    expect(s.items.every((u) => u.role === 'ADMIN')).toBe(true);
  });
});

function parseRoundTrip(q: Parameters<typeof codec.serialize>[0]) {
  return codec.parse(new URLSearchParams(codec.serialize(q)));
}

