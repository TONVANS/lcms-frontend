import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { legalCasesService, toLegalCaseListParams } from './legal-cases.service';

beforeEach(() => vi.restoreAllMocks());

describe('toLegalCaseListParams', () => {
  it('maps store names to backend names and omits empties', () => {
    expect(
      toLegalCaseListParams({
        page: 3,
        pageSize: 50,
        q: ' k ',
        caseType: 'CIVIL',
        disputeStatus: 'APPEAL',
        departmentId: 'd',
        startDate: '2026-01-01',
        endDate: '2026-02-01',
      }),
    ).toEqual({
      page: 3,
      limit: 50,
      search: 'k',
      caseType: 'CIVIL',
      disputeStatus: 'APPEAL',
      departmentId: 'd',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
    });
    expect(toLegalCaseListParams({ q: '', departmentId: '' })).toEqual({});
  });
});

describe('legalCasesService', () => {
  it('list maps rows (internalId) and meta', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: [{ id: 1, internalId: 'u1', caseCode: 'C' }], meta: { total: 9, page: 1, limit: 10, totalPages: 1 } },
    });
    const res = await legalCasesService.list({ page: 1, pageSize: 10 });
    expect(get).toHaveBeenCalledWith('/legal-cases', { params: { page: 1, limit: 10 } });
    expect(res.total).toBe(9);
    expect(res.items[0].id).toBe('u1');
  });

  it('create, update and remove hit the detail routes', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { internalId: 'n' } } });
    const created = await legalCasesService.create({
      caseCode: 'C', defendant: 'D', caseType: 'CIVIL', disputeStatus: 'APPEAL', date: '2026-01-01',
      damageLak: 0, damageUsd: 0, fineLak: 0, fineUsd: 0, recoveredLak: 0, recoveredUsd: 0,
    });
    expect(created.id).toBe('n');
    expect(post.mock.calls[0][0]).toBe('/legal-cases');
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: { id: 'x' } } });
    await legalCasesService.update('x y', { defendant: 'Z' });
    expect(patch).toHaveBeenCalledWith('/legal-cases/x%20y', { defendant: 'Z' });
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: undefined });
    await legalCasesService.remove('x');
    expect(del).toHaveBeenCalledWith('/legal-cases/x');
  });

  it('dashboard goes through the tolerant mapper', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { total: 2, lak: { damage: 5 } } } });
    const d = await legalCasesService.dashboard();
    expect(d.total).toBe(2);
    expect(d.lak.damage).toBe(5);
  });
});
