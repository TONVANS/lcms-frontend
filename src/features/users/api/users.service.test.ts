import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { usersMockDb } from '../mocks/users.mock';
import { toUserListParams, usersService } from './users.service';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  usersMockDb.reset();
  clearMockSession();
  setMockSession('admin', false);
});

describe('toUserListParams', () => {
  it('maps to backend names and omits empties', () => {
    expect(toUserListParams({ page: 2, pageSize: 20, q: ' ab ', role: 'EDITOR', isActive: false })).toEqual({
      page: 2,
      limit: 20,
      search: 'ab',
      role: 'EDITOR',
      isActive: false,
    });
    expect(toUserListParams({ page: 1, q: '  ' })).toEqual({ page: 1 });
    expect(toUserListParams()).toEqual({});
  });
});

describe('usersService', () => {
  it('lists with filters', async () => {
    const res = await usersService.list({ page: 1, pageSize: 5, role: 'VIEWER' });
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((u) => u.role === 'VIEWER')).toBe(true);
    expect(res.total).toBeGreaterThanOrEqual(res.items.length);
  });
  it('creates, updates and removes', async () => {
    const created = await usersService.create({
      employeeCode: 'NEW-1',
      role: 'VIEWER',
      canView: true,
      canUpload: false,
      canEdit: false,
      canDelete: false,
      canDownload: false,
      fullName: 'New Person',
    });
    expect(created.employeeCode).toBe('NEW-1');
    const upd = await usersService.update(created.id, { role: 'EDITOR', canEdit: true });
    expect(upd).toMatchObject({ role: 'EDITOR', canEdit: true });
    expect((await usersService.get(created.id)).role).toBe('EDITOR');
    await usersService.remove(created.id);
    await expect(usersService.get(created.id)).rejects.toMatchObject({ status: 404 });
  });
  it('looks up HRM', async () => {
    const e = await usersService.hrmLookup('EDL-001');
    expect(e.fullName).toBeTruthy();
    await expect(usersService.hrmLookup('NOPE')).rejects.toMatchObject({ status: 404 });
  });
});
