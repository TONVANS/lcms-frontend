import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { regulationsMockDb } from '../mocks/regulations.mock';
import { regulationsService } from './regulations.service';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  regulationsMockDb.reset(new Date());
  setMockSession('legal.viewer', false);
});

describe('regulationsService', () => {
  it('list passes query params and returns Paginated', async () => {
    const r = await regulationsService.list({
      status: 'repealed',
      sort: 'number',
      order: 'asc',
      page: 1,
      pageSize: 25,
    });
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(25);
    expect(r.total).toBe(r.items.length);
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items.every((x) => x.status === 'repealed')).toBe(true);
    const numbers = r.items.map((x) => x.number);
    expect(numbers).toEqual([...numbers].sort());
  });
});
