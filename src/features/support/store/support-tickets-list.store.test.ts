import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import {
  supportTicketsQueryCodec as codec,
  useSupportTicketsListStore as store,
} from './support-tickets-list.store';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  store.getState().reset();
});

describe('support tickets list store', () => {
  it('codec carries status, page, and pageSize through URL', () => {
    const q = codec.parse(
      new URLSearchParams('status=OPEN&page=2&pageSize=50&sort=x'),
    );
    expect(q).toEqual({
      page: 2,
      pageSize: 50,
      status: 'OPEN',
    });
    expect(codec.parse(new URLSearchParams(codec.serialize(q)))).toEqual(q);
  });

  it('fetches a filtered page through the service', async () => {
    setMockSession('admin', false);
    store.getState().setQuery({ status: 'OPEN' });
    await store.getState().fetch();
    const s = store.getState();
    expect(s.status).toBe('ready');
    expect(s.items.length).toBeGreaterThan(0);
    expect(s.items.every((t) => t.status === 'OPEN')).toBe(true);
  });
});
