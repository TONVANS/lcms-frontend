import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { runLogoutResets } from '@/lib/auth/logout-registry';
import { notificationsService } from '../api/notifications.service';
import type { AppNotification } from '../types';
import { contractHref, useNotificationsStore } from './notifications.store';

const byName = (n: string) => MOCK_USERS.find((u) => u.username === n)!;

const mk = (
  id: string,
  source: 'contracts' | 'power',
  createdAt: string,
  read = false,
): AppNotification => ({
  id,
  source,
  title: `T${id}`,
  message: null,
  contractId: `c${id}`,
  contractLabel: null,
  daysLeft: null,
  expirationDate: null,
  read,
  createdAt,
});

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const serverError = { status: 500, code: 'SERVER', message: 'x' };

beforeEach(() => {
  vi.restoreAllMocks();
  useNotificationsStore.getState().reset();
});

describe('notifications store', () => {
  it('merges both sources newest first and counts unread', async () => {
    vi.spyOn(notificationsService, 'list').mockImplementation(async (source) =>
      source === 'contracts'
        ? [
            mk('1', 'contracts', '2026-10-01T00:00:00Z'),
            mk('2', 'contracts', '2026-10-03T00:00:00Z', true),
          ]
        : [mk('9', 'power', '2026-10-02T00:00:00Z')],
    );
    await useNotificationsStore.getState().fetch(byName('admin'));
    const s = useNotificationsStore.getState();
    expect(s.items.map((i) => i.id)).toEqual(['2', '9', '1']);
    expect(s.unreadCount).toBe(2);
    expect(s.status).toBe('ready');
  });

  it('only calls the sources the user holds', async () => {
    const list = vi.spyOn(notificationsService, 'list').mockResolvedValue([]);
    await useNotificationsStore.getState().fetch(byName('gc.user'));
    expect(list.mock.calls.map((c) => c[0])).toEqual(['contracts']);
    list.mockClear();
    await useNotificationsStore.getState().fetch(byName('ppa.user'));
    expect(list.mock.calls.map((c) => c[0])).toEqual(['power']);
    list.mockClear();
    await useNotificationsStore.getState().fetch(byName('none.user'));
    expect(list).not.toHaveBeenCalled();
    expect(useNotificationsStore.getState().status).toBe('ready');
  });

  it('sets error status on failure', async () => {
    vi.spyOn(notificationsService, 'list').mockRejectedValue(serverError);
    await useNotificationsStore.getState().fetch(byName('gc.user'));
    const s = useNotificationsStore.getState();
    expect(s.status).toBe('error');
    expect(s.error).toBeTruthy();
  });

  it('ignores canceled errors', async () => {
    vi.spyOn(notificationsService, 'list').mockRejectedValue({
      code: 'ERR_CANCELED',
      name: 'CanceledError',
    });
    await useNotificationsStore.getState().fetch(byName('gc.user'));
    expect(useNotificationsStore.getState().status).not.toBe('error');
    expect(useNotificationsStore.getState().error).toBeNull();
  });

  it('drops a fetch result that resolves after reset (generation)', async () => {
    const d = deferred<AppNotification[]>();
    vi.spyOn(notificationsService, 'list').mockReturnValue(d.promise);
    const p = useNotificationsStore.getState().fetch(byName('gc.user'));
    useNotificationsStore.getState().reset();
    d.resolve([mk('1', 'contracts', '2026-10-01T00:00:00Z')]);
    await p;
    expect(useNotificationsStore.getState()).toMatchObject({
      items: [],
      unreadCount: 0,
      status: 'idle',
    });
  });

  it('only the newest fetch writes', async () => {
    const a = deferred<AppNotification[]>();
    const b = deferred<AppNotification[]>();
    vi.spyOn(notificationsService, 'list')
      .mockReturnValueOnce(a.promise)
      .mockReturnValueOnce(b.promise);
    const u = byName('gc.user');
    const p1 = useNotificationsStore.getState().fetch(u);
    const p2 = useNotificationsStore.getState().fetch(u);
    b.resolve([mk('new', 'contracts', '2026-10-02T00:00:00Z')]);
    await p2;
    a.resolve([mk('old', 'contracts', '2026-10-01T00:00:00Z')]);
    await p1;
    expect(useNotificationsStore.getState().items.map((i) => i.id)).toEqual(['new']);
  });

  it('markRead is optimistic and keeps the change on success', async () => {
    vi.spyOn(notificationsService, 'list').mockResolvedValue([
      mk('1', 'contracts', '2026-10-01T00:00:00Z'),
    ]);
    const mark = vi.spyOn(notificationsService, 'markRead').mockResolvedValue();
    await useNotificationsStore.getState().fetch(byName('gc.user'));
    const n = useNotificationsStore.getState().items[0];
    const p = useNotificationsStore.getState().markRead(n);
    expect(useNotificationsStore.getState().items[0].read).toBe(true);
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
    await p;
    expect(mark).toHaveBeenCalledWith('contracts', '1');
    expect(useNotificationsStore.getState().items[0].read).toBe(true);
  });

  it('markRead rolls back on failure', async () => {
    vi.spyOn(notificationsService, 'list').mockResolvedValue([
      mk('1', 'contracts', '2026-10-01T00:00:00Z'),
    ]);
    vi.spyOn(notificationsService, 'markRead').mockRejectedValue(serverError);
    await useNotificationsStore.getState().fetch(byName('gc.user'));
    await useNotificationsStore.getState().markRead(useNotificationsStore.getState().items[0]);
    const s = useNotificationsStore.getState();
    expect(s.items[0].read).toBe(false);
    expect(s.unreadCount).toBe(1);
    expect(s.error).toBeTruthy();
  });

  it('markAllRead marks every item and calls each source the user has', async () => {
    vi.spyOn(notificationsService, 'list').mockImplementation(async (source) => [
      mk(source === 'power' ? 'p' : 'c', source, '2026-10-01T00:00:00Z'),
    ]);
    const all = vi.spyOn(notificationsService, 'markAllRead').mockResolvedValue();
    await useNotificationsStore.getState().fetch(byName('admin'));
    await useNotificationsStore.getState().markAllRead();
    expect(all.mock.calls.map((c) => c[0]).sort()).toEqual(['contracts', 'power']);
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
  });

  it('markAllRead rolls back only the failing source', async () => {
    vi.spyOn(notificationsService, 'list').mockImplementation(async (source) => [
      mk(source === 'power' ? 'p' : 'c', source, '2026-10-01T00:00:00Z'),
    ]);
    vi.spyOn(notificationsService, 'markAllRead').mockImplementation(async (source) => {
      if (source === 'power') throw serverError;
    });
    await useNotificationsStore.getState().fetch(byName('admin'));
    await useNotificationsStore.getState().markAllRead();
    const s = useNotificationsStore.getState();
    expect(s.items.find((i) => i.source === 'contracts')!.read).toBe(true);
    expect(s.items.find((i) => i.source === 'power')!.read).toBe(false);
    expect(s.unreadCount).toBe(1);
  });

  it('is cleared by the logout registry', async () => {
    vi.spyOn(notificationsService, 'list').mockResolvedValue([
      mk('1', 'contracts', '2026-10-01T00:00:00Z'),
    ]);
    await useNotificationsStore.getState().fetch(byName('gc.user'));
    runLogoutResets();
    expect(useNotificationsStore.getState()).toMatchObject({
      items: [],
      unreadCount: 0,
      status: 'idle',
    });
  });
});

describe('contractHref', () => {
  it('routes by source', () => {
    expect(contractHref(mk('1', 'contracts', ''))).toBe('/contracts/c1');
    expect(contractHref(mk('2', 'power', ''))).toBe('/ppa/contracts/c2');
    expect(contractHref({ ...mk('3', 'power', ''), contractId: null })).toBeNull();
  });
});
