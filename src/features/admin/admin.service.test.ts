import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { adminService } from './admin.service';

const get = vi.spyOn(api, 'get');
const post = vi.spyOn(api, 'post');
const patch = vi.spyOn(api, 'patch');
const del = vi.spyOn(api, 'delete');

beforeEach(() => {
  get.mockResolvedValue({ data: { data: [] } });
  post.mockResolvedValue({ data: { data: { id: '1' } } });
  patch.mockResolvedValue({ data: { data: { id: '1' } } });
  del.mockResolvedValue({ data: {} });
});
afterEach(() => vi.clearAllMocks());

describe('adminService', () => {
  it('audit logs: maps pageSize to limit and drops empty filters', async () => {
    await adminService.auditLogs.list({ page: 2, pageSize: 20, action: 'CREATE_CONTRACT', userId: ' ' });
    expect(get).toHaveBeenCalledWith('/audit-logs', {
      params: { page: 2, limit: 20, action: 'CREATE_CONTRACT' },
    });
  });

  it('contract types: list params, create, update, remove', async () => {
    await adminService.contractTypes.list({ search: ' ab ', isActive: true });
    expect(get).toHaveBeenCalledWith('/contract-types', { params: { search: 'ab', isActive: true } });
    await adminService.contractTypes.list({});
    expect(get).toHaveBeenLastCalledWith('/contract-types', { params: {} });
    await adminService.contractTypes.create({ nameLo: 'x', isActive: true });
    expect(post).toHaveBeenCalledWith('/contract-types', { nameLo: 'x', isActive: true });
    await adminService.contractTypes.update('5', { nameLo: 'y', isActive: false });
    expect(patch).toHaveBeenCalledWith('/contract-types/5', { nameLo: 'y', isActive: false });
    await adminService.contractTypes.remove('5');
    expect(del).toHaveBeenCalledWith('/contract-types/5');
  });

  it('departments: list maps rows, sync reads counts tolerantly', async () => {
    get.mockResolvedValueOnce({
      data: { data: [{ id: 'd1', name: 'N', code: 'C', isActive: false }] },
    });
    const rows = await adminService.departments.list({ search: 'N' });
    expect(rows).toEqual([{ id: 'd1', name: 'N', code: 'C', isActive: false }]);
    post.mockResolvedValueOnce({ data: { data: { created: '2', updated: 3, total: 9 } } });
    expect(await adminService.departments.sync()).toEqual({ created: 2, updated: 3, total: 9 });
    expect(post).toHaveBeenLastCalledWith('/departments/sync');
    post.mockResolvedValueOnce({ data: 'ok' });
    expect(await adminService.departments.sync()).toEqual({ created: null, updated: null, total: null });
  });
});
