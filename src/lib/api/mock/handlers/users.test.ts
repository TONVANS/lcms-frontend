import { beforeEach, describe, expect, it } from 'vitest';
import { usersMockDb } from '@/features/users/mocks/users.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

const body = {
  employeeCode: 'ZZ-1',
  role: 'VIEWER',
  canView: true,
  canUpload: false,
  canEdit: false,
  canDelete: false,
  canDownload: false,
  fullName: 'Zed',
};

beforeEach(() => {
  installMocks(api, { delay: 0 });
  usersMockDb.reset();
  clearMockSession();
  setMockSession('admin', false);
});

const status = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e) => (e as { status: number }).status,
  );

describe('users mock handler', () => {
  it('401 without session, 403 for non-admin', async () => {
    clearMockSession();
    expect(await status(api.get('/users'))).toBe(401);
    setMockSession('gc.user', false);
    expect(await status(api.get('/users'))).toBe(403);
    expect(await status(api.post('/users', body))).toBe(403);
    expect(await status(api.get('/users/hrm/EDL-001'))).toBe(403);
  });

  it('lists with { data, meta }, paginates and filters', async () => {
    const r = await api.get('/users', { params: { page: 1, limit: 5 } });
    expect(r.data.data).toHaveLength(5);
    expect(r.data.meta.total).toBeGreaterThan(5);
    expect(r.data.meta.page).toBe(1);
    const inactive = await api.get('/users', { params: { isActive: false } });
    expect(inactive.data.data.length).toBeGreaterThan(0);
    expect(inactive.data.data.every((u: { isActive: boolean }) => !u.isActive)).toBe(true);
    const s = await api.get('/users', { params: { search: 'gc.viewer' } });
    expect(s.data.data.map((u: { username: string }) => u.username)).toContain('gc.viewer');
  });

  it('creates, 409 on duplicate, 400 without name when HRM unknown', async () => {
    const c = await api.post('/users', body);
    expect(c.status).toBe(201);
    expect(c.data.data.employeeCode).toBe('ZZ-1');
    expect(await status(api.post('/users', body))).toBe(409);
    expect(await status(api.post('/users', { ...body, employeeCode: 'ZZ-2', fullName: undefined }))).toBe(400);
  });

  it('create autofills from HRM when the code is known', async () => {
    const c = await api.post('/users', { ...body, employeeCode: 'EDL-001', fullName: undefined });
    expect(c.data.data.fullName).toBeTruthy();
  });

  it('hrm lookup 200 / 404', async () => {
    expect((await api.get('/users/hrm/EDL-001')).data.data.employeeCode).toBe('EDL-001');
    expect(await status(api.get('/users/hrm/NOPE'))).toBe(404);
  });

  it('patch and delete; cannot delete yourself', async () => {
    const c = await api.post('/users', body);
    const id = c.data.data.id;
    const p = await api.patch(`/users/${id}`, { role: 'EDITOR', isActive: false });
    expect(p.data.data).toMatchObject({ role: 'EDITOR', isActive: false });
    expect((await api.delete(`/users/${id}`)).status).toBe(200);
    expect(await status(api.get(`/users/${id}`))).toBe(404);
    expect(await status(api.patch(`/users/${id}`, { role: 'VIEWER' }))).toBe(404);
    expect(await status(api.delete('/users/u-1'))).toBe(400);
  });
});
