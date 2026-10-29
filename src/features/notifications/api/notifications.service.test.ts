import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { notificationsService } from './notifications.service';

beforeEach(() => vi.restoreAllMocks());

describe('notificationsService', () => {
  it('lists contracts notifications from a { data: [] } envelope, sending unreadOnly=false by default', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [{ id: 1, title: 'A' }] } });
    const items = await notificationsService.list('contracts');
    expect(get).toHaveBeenCalledWith('/notifications', expect.objectContaining({ params: { unreadOnly: false } }));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: '1', source: 'contracts', title: 'A' });
  });

  it('lists power notifications from a bare array and honours unreadOnly', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [{ id: 'p', title: 'P' }] });
    const items = await notificationsService.list('power', { unreadOnly: true });
    expect(get).toHaveBeenCalledWith('/power-notifications', expect.objectContaining({ params: { unreadOnly: true } }));
    expect(items[0].source).toBe('power');
  });

  it('accepts a paginated envelope', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { items: [{ id: 2 }], total: 1 } } });
    expect(await notificationsService.list('contracts')).toHaveLength(1);
  });

  it('passes an abort signal through', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
    const ac = new AbortController();
    await notificationsService.list('contracts', { signal: ac.signal });
    expect(get.mock.calls[0][1]).toMatchObject({ signal: ac.signal });
  });

  it('marks one read via PATCH on the right source', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: {} });
    await notificationsService.markRead('power', 'a/b');
    expect(patch).toHaveBeenCalledWith('/power-notifications/a%2Fb/read');
    await notificationsService.markRead('contracts', '5');
    expect(patch).toHaveBeenCalledWith('/notifications/5/read');
  });

  it('marks all read per source', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: {} });
    await notificationsService.markAllRead('contracts');
    expect(patch).toHaveBeenCalledWith('/notifications/read-all');
    await notificationsService.markAllRead('power');
    expect(patch).toHaveBeenCalledWith('/power-notifications/read-all');
  });
});
