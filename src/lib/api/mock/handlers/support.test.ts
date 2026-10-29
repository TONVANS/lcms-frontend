import { beforeEach, describe, expect, it } from 'vitest';
import { supportService } from '@/features/support/api/support.service';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

beforeEach(() => {
  installMocks(api, { delay: 0 });
});

describe('support mock handler', () => {
  it('returns 401 without a session', async () => {
    clearMockSession();
    await expect(supportService.contacts()).rejects.toMatchObject({ status: 401 });
    await expect(supportService.tickets({ page: 1, pageSize: 10 })).rejects.toMatchObject({ status: 401 });
  });

  it('lists contacts for any signed-in user', async () => {
    setMockSession('none.user', false);
    const rows = await supportService.contacts();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows.length).toBeLessThanOrEqual(4);
  });

  it('only admins create and delete contacts', async () => {
    setMockSession('gc.user', false);
    await expect(supportService.createContact({ channelName: 'X', contactInfo: 'y' })).rejects.toMatchObject({ status: 403 });
    await expect(supportService.deleteContact('1')).rejects.toMatchObject({ status: 403 });
    setMockSession('admin', false);
    const before = (await supportService.contacts()).length;
    const c = await supportService.createContact({ channelName: 'Line', contactInfo: '@lcms' });
    expect((await supportService.contacts()).length).toBe(before + 1);
    await supportService.deleteContact(c.id);
    expect((await supportService.contacts()).length).toBe(before);
    await expect(supportService.deleteContact('does-not-exist')).rejects.toMatchObject({ status: 404 });
  });

  it('non-admins see only their own tickets; admins see all with pagination meta', async () => {
    setMockSession('admin', false);
    const all = await supportService.tickets({ page: 1, pageSize: 5 });
    expect(all.total).toBe(12);
    expect(all.items).toHaveLength(5);
    setMockSession('gc.user', false);
    const mine = await supportService.tickets({ page: 1, pageSize: 50 });
    expect(mine.total).toBeGreaterThan(0);
    expect(mine.total).toBeLessThan(12);
    expect(new Set(mine.items.map((t) => t.createdBy)).size).toBe(1);
  });

  it('filters by status', async () => {
    setMockSession('admin', false);
    const open = await supportService.tickets({ page: 1, pageSize: 50, status: 'OPEN' });
    expect(open.items.length).toBeGreaterThan(0);
    expect(open.items.every((t) => t.status === 'OPEN')).toBe(true);
  });

  it('creates a ticket (JSON and multipart) owned by the caller', async () => {
    setMockSession('gc.user', false);
    const a = await supportService.createTicket({ subject: 'A', description: 'a', priority: 'LOW' });
    expect(a).toMatchObject({ subject: 'A', status: 'OPEN', priority: 'LOW', hasAttachment: false });
    const file = new File(['x'], 'p.png', { type: 'image/png' });
    const b = await supportService.createTicket({ subject: 'B', description: 'b', priority: 'HIGH', file });
    expect(b.hasAttachment).toBe(true);
    const blob = await supportService.ticketAttachment(b.id);
    expect(blob).toBeTruthy();
    const mine = await supportService.tickets({ page: 1, pageSize: 50 });
    expect(mine.items.map((t) => t.id)).toContain(b.id);
  });

  it('only admins patch tickets', async () => {
    setMockSession('gc.user', false);
    await expect(supportService.updateTicket('t-001', { status: 'CLOSED' })).rejects.toMatchObject({ status: 403 });
    setMockSession('admin', false);
    const t = await supportService.updateTicket('t-001', { status: 'RESOLVED', adminNote: 'ok' });
    expect(t).toMatchObject({ status: 'RESOLVED', adminNote: 'ok' });
    await expect(supportService.updateTicket('nope', { status: 'CLOSED' })).rejects.toMatchObject({ status: 404 });
  });

  it('hides other users tickets from non-admins', async () => {
    setMockSession('gc.user', false);
    await expect(supportService.ticket('t-003')).rejects.toMatchObject({ status: 404 });
    await expect(supportService.ticket('t-001')).resolves.toMatchObject({ id: 't-001' });
  });
});
