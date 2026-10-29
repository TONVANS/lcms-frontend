import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { supportService } from './support.service';

beforeEach(() => vi.restoreAllMocks());

describe('supportService', () => {
  it('lists contacts sorted by sortOrder', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: [{ id: 2, channelName: 'B', contactInfo: 'b', sortOrder: 2 }, { id: 1, channelName: 'A', contactInfo: 'a', sortOrder: 1 }] },
    });
    const rows = await supportService.contacts();
    expect(get).toHaveBeenCalledWith('/support/contacts');
    expect(rows.map((r) => r.id)).toEqual(['1', '2']);
  });

  it('creates and deletes contacts', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { id: 9, channelName: 'X', contactInfo: 'y' } } });
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: {} });
    const c = await supportService.createContact({ channelName: 'X', contactInfo: 'y' });
    expect(post).toHaveBeenCalledWith('/support/contacts', { channelName: 'X', contactInfo: 'y' });
    expect(c.id).toBe('9');
    await supportService.deleteContact('9');
    expect(del).toHaveBeenCalledWith('/support/contacts/9');
  });

  it('lists tickets mapping pageSize to limit and omitting an empty status', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: [{ id: 1, subject: 'S' }], meta: { total: 31 } },
    });
    const page = await supportService.tickets({ page: 2, pageSize: 10 });
    expect(get).toHaveBeenCalledWith('/support/tickets', { params: { page: 2, limit: 10 } });
    expect(page).toMatchObject({ total: 31, page: 2, pageSize: 10 });
    expect(page.items[0].subject).toBe('S');
    await supportService.tickets({ page: 1, pageSize: 10, status: 'OPEN' });
    expect(get).toHaveBeenLastCalledWith('/support/tickets', { params: { page: 1, limit: 10, status: 'OPEN' } });
  });

  it('gets one ticket', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { id: 'a/b', subject: 'S' } } });
    const t = await supportService.ticket('a/b');
    expect(get).toHaveBeenCalledWith('/support/tickets/a%2Fb');
    expect(t.subject).toBe('S');
  });

  it('creates a ticket as JSON when there is no file', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { id: 5 } } });
    await supportService.createTicket({ subject: 'S', description: 'D', priority: 'LOW' });
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe('/support/tickets');
    expect(post.mock.calls[0][1]).toEqual({ subject: 'S', description: 'D', priority: 'LOW' });
    expect(post.mock.calls[0][1]).not.toBeInstanceOf(FormData);
  });

  it('creates a ticket as multipart FormData when a file is attached', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { id: 5 } } });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await supportService.createTicket({ subject: 'S', description: 'D', priority: 'HIGH', file });
    const body = post.mock.calls[0][1] as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('subject')).toBe('S');
    expect(body.get('description')).toBe('D');
    expect(body.get('priority')).toBe('HIGH');
    expect((body.get('file') as File).name).toBe('a.png');
    expect(post.mock.calls[0][2]).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } });
  });

  it('updates a ticket with PATCH', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: { id: 1, status: 'RESOLVED' } } });
    const t = await supportService.updateTicket('1', { status: 'RESOLVED', adminNote: 'done' });
    expect(patch).toHaveBeenCalledWith('/support/tickets/1', { status: 'RESOLVED', adminNote: 'done' });
    expect(t.status).toBe('RESOLVED');
  });

  it('fetches the attachment as a blob', async () => {
    const blob = new Blob(['x']);
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: blob });
    expect(await supportService.ticketAttachment('7')).toBe(blob);
    expect(get).toHaveBeenCalledWith('/support/tickets/7/attachment', { responseType: 'blob' });
  });
});
