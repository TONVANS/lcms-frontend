import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { gcService } from './gc.service';

afterEach(() => vi.restoreAllMocks());

const page = { data: [{ id: 'gc-1', title: 'A', contractNumber: 'N', contractValue: '10' }], meta: { total: 41 } };

describe('gcService.list', () => {
  it('maps query names and omits empty values', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: page } as never);
    const res = await gcService.list({ page: 2, pageSize: 20, q: 'abc', status: 'ACTIVE', contractTypeId: 3 });
    expect(get).toHaveBeenCalledWith('/contracts', {
      params: { page: 2, limit: 20, search: 'abc', status: 'ACTIVE', contractTypeId: 3 },
    });
    expect(res.total).toBe(41);
    expect(res.page).toBe(2);
    expect(res.items[0].contractValue).toBe(10);

    get.mockClear();
    await gcService.list({ page: 1, pageSize: 10, q: '  ' });
    expect(get).toHaveBeenCalledWith('/contracts', { params: { page: 1, limit: 10 } });
  });
});

describe('gcService CRUD', () => {
  it('get/create/update/remove use the contracts endpoints and unwrap data', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { id: 'x', title: 'T' } } } as never);
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { id: 'n' } } } as never);
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: { id: 'x' } } } as never);
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: undefined } as never);
    expect((await gcService.get('x')).title).toBe('T');
    expect((await gcService.create({ title: 'a' })).id).toBe('n');
    expect(post).toHaveBeenCalledWith('/contracts', { title: 'a' });
    await gcService.update('x', { title: 'b' });
    expect(patch).toHaveBeenCalledWith('/contracts/x', { title: 'b' });
    await gcService.remove('x');
    expect(del).toHaveBeenCalledWith('/contracts/x');
  });

  it('dashboard goes through the tolerant mapper', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { total: 3, byStatus: { ACTIVE: 3 } } } } as never);
    const d = await gcService.dashboard();
    expect(d.total).toBe(3);
    expect(d.byStatus.find((s) => s.status === 'ACTIVE')?.count).toBe(3);
  });
});
