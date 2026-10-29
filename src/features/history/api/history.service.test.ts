import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { historyService } from './history.service';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  setMockSession('admin', false);
});
afterEach(() => clearMockSession());

describe('historyService', () => {
  it('lists contract history as a mapped page', async () => {
    const page = await historyService.list('contracts', 'gc-001', { page: 1, pageSize: 2 });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBeGreaterThan(2);
    expect(page.page).toBe(1);
    expect(page.items[0]).toMatchObject({ id: expect.any(String), action: expect.any(String) });
  });

  it('paginates', async () => {
    const p1 = await historyService.list('contracts', 'gc-001', { page: 1, pageSize: 2 });
    const p2 = await historyService.list('contracts', 'gc-001', { page: 2, pageSize: 2 });
    expect(p2.items[0].id).not.toBe(p1.items[0].id);
  });

  it('filters by action', async () => {
    const page = await historyService.list('contracts', 'gc-001', {
      page: 1,
      pageSize: 10,
      action: 'UPDATE_CONTRACT',
    });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((i) => i.action === 'UPDATE_CONTRACT')).toBe(true);
  });

  it('lists power-contract history', async () => {
    const page = await historyService.list('power-contracts', 'ppa-1', { page: 1, pageSize: 10 });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items[0].action).toMatch(/POWER_CONTRACT/);
  });

  it('401 without a session', async () => {
    clearMockSession();
    await expect(historyService.list('contracts', 'gc-001', { page: 1, pageSize: 5 })).rejects.toMatchObject({
      status: 401,
    });
  });
});
