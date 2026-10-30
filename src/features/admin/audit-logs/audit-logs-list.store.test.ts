import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { adminMockDb } from '../mocks/admin.mock';
import { auditLogsQueryCodec as codec, useAuditLogsListStore as store } from './audit-logs-list.store';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  adminMockDb.reset();
  store.getState().reset();
});

describe('audit logs list store', () => {
  it('codec carries action, userId, page and pageSize through the URL', () => {
    const q = codec.parse(
      new URLSearchParams('action=CREATE&userId=user-1&page=2&pageSize=50&sort=x'),
    );
    expect(q).toEqual({
      page: 2,
      pageSize: 50,
      action: 'CREATE',
      userId: 'user-1',
    });
    expect(parseRoundTrip(q)).toEqual(q);
  });

  it('fetches a filtered page through the service', async () => {
    setMockSession('admin', false);
    store.getState().setQuery({ action: 'UPDATE_CONTRACT' });
    await store.getState().fetch();
    const s = store.getState();
    expect(s.status).toBe('ready');
    expect(s.items.length).toBeGreaterThan(0);
    expect(s.items.every((l) => l.action === 'UPDATE_CONTRACT')).toBe(true);
  });
});

function parseRoundTrip(q: Parameters<typeof codec.serialize>[0]) {
  return codec.parse(new URLSearchParams(codec.serialize(q)));
}
