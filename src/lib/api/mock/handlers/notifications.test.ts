import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { notificationsService } from '@/features/notifications';

beforeEach(() => {
  installMocks(api, { delay: 0 });
});

describe('notifications mock handler', () => {
  it('returns 401 without a session', async () => {
    clearMockSession();
    await expect(notificationsService.list('contracts')).rejects.toMatchObject({ status: 401 });
  });

  it('returns 403 when the user lacks the module', async () => {
    setMockSession('gc.user', false);
    await expect(notificationsService.list('power')).rejects.toMatchObject({ status: 403 });
    await expect(notificationsService.list('contracts')).resolves.toBeTruthy();
  });

  it('lists, filters unread and marks read', async () => {
    setMockSession('admin', false);
    const all = await notificationsService.list('contracts');
    const unread = await notificationsService.list('contracts', { unreadOnly: true });
    expect(all.length).toBe(8);
    expect(unread.length).toBeLessThan(all.length);
    await notificationsService.markRead('contracts', unread[0].id);
    const after = await notificationsService.list('contracts', { unreadOnly: true });
    expect(after.length).toBe(unread.length - 1);
    await notificationsService.markAllRead('power');
    expect(await notificationsService.list('power', { unreadOnly: true })).toHaveLength(0);
    expect((await notificationsService.list('power')).length).toBe(6);
  });
});
