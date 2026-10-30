import { beforeEach, describe, expect, it } from 'vitest';
import { adminMockDb } from '@/features/admin/mocks/admin.mock';
import { api } from '@/lib/api/client';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { installMocks } from '..';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  adminMockDb.reset(new Date());
  setMockSession('admin', false);
});

describe('admin mock handler', () => {
  it('401 without session, 403 for non-admin', async () => {
    clearMockSession();
    await expect(api.get('/audit-logs')).rejects.toMatchObject({ status: 401 });
    await expect(api.get('/contract-types')).rejects.toMatchObject({ status: 401 });
    setMockSession('gc.user', false);
    await expect(api.get('/audit-logs')).rejects.toMatchObject({ status: 403 });
    await expect(api.post('/departments', { name: 'x' })).rejects.toMatchObject({ status: 403 });
    await expect(api.post('/departments/sync')).rejects.toMatchObject({ status: 403 });
  });

  it('audit logs: paginated and filterable', async () => {
    const all = await api.get('/audit-logs', { params: { page: 1, limit: 10 } });
    expect(all.data.data).toHaveLength(10);
    expect(all.data.meta).toMatchObject({ total: 30, page: 1, limit: 10, totalPages: 3 });
    const f = await api.get('/audit-logs', { params: { action: 'CREATE_CONTRACT' } });
    expect(f.data.data.length).toBeGreaterThan(0);
    expect(f.data.data.every((r: { action: string }) => r.action === 'CREATE_CONTRACT')).toBe(true);
    const uid = all.data.data[0].userId;
    const u = await api.get('/audit-logs', { params: { userId: uid } });
    expect(u.data.data.every((r: { userId: string }) => r.userId === uid)).toBe(true);
  });

  it('contract types: CRUD, search, isActive, 409 duplicate, 400 in use', async () => {
    const list = await api.get('/contract-types');
    expect(list.data.data).toHaveLength(14);
    const created = await api.post('/contract-types', { nameLo: 'ໃໝ່', nameEn: 'New', isActive: true });
    expect(created.status).toBe(201);
    const id = created.data.data.id;
    await expect(api.post('/contract-types', { nameLo: 'ໃໝ່' })).rejects.toMatchObject({ status: 409 });
    await api.patch(`/contract-types/${id}`, { isActive: false });
    const inactive = await api.get('/contract-types', { params: { isActive: false } });
    expect(inactive.data.data).toHaveLength(1);
    const s = await api.get('/contract-types', { params: { search: 'EPC' } });
    expect(s.data.data).toHaveLength(1);
    await expect(api.delete('/contract-types/1')).rejects.toMatchObject({ status: 400 });
    await api.delete(`/contract-types/${id}`);
    await expect(api.get(`/contract-types/${id}`)).rejects.toMatchObject({ status: 404 });
    // dropdown reflects the shared DB (active only)
    const dd = await api.get('/contract-types/dropdown');
    expect(dd.data.data).toHaveLength(14);
  });

  it('departments: CRUD, 409 duplicate name/code, 400 in use, sync', async () => {
    const c = await api.post('/departments', { name: 'ຝ່າຍໃໝ່', code: 'NEW', isActive: true });
    const id = c.data.data.id;
    await expect(api.post('/departments', { name: 'ຝ່າຍໃໝ່' })).rejects.toMatchObject({ status: 409 });
    await expect(api.post('/departments', { name: 'other', code: 'NEW' })).rejects.toMatchObject({ status: 409 });
    await api.patch(`/departments/${id}`, { name: 'ຊື່ໃໝ່' });
    expect((await api.get(`/departments/${id}`)).data.data.name).toBe('ຊື່ໃໝ່');
    const first = adminMockDb.departments()[0].id;
    await expect(api.delete(`/departments/${first}`)).rejects.toMatchObject({ status: 400 });
    await api.delete(`/departments/${id}`);
    const s = await api.post('/departments/sync');
    expect(s.data.data).toMatchObject({ created: expect.any(Number), updated: expect.any(Number), total: expect.any(Number) });
    const dd = await api.get('/departments/dropdown');
    expect(dd.data.data.length).toBe(s.data.data.total);
  });
});
