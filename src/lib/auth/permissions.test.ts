import { describe, expect, it } from 'vitest';
import type { ModuleKey, User } from '@/types/domain';
import { canAccessModule, getAccessibleModules, getLandingRoute, hasPermission } from './permissions';

const base: User = {
  id: '1',
  fullName: 'T',
  username: 't',
  email: 't@x.la',
  role: 'user',
  departmentId: 'd',
  departmentName: 'D',
  modules: [],
};
const mk = (modules: ModuleKey[], role: User['role'] = 'user'): User => ({ ...base, role, modules });
const admin = mk(['ppa', 'gc', 'legal'], 'admin');
const ppaUser = mk(['ppa']);
const gcUser = mk(['gc']);
const multi = mk(['ppa', 'legal']);
const none = mk([]);

describe('permissions', () => {
  it('landing route', () => {
    expect(getLandingRoute(admin)).toBe('/');
    expect(getLandingRoute(ppaUser)).toBe('/ppa');
    expect(getLandingRoute(gcUser)).toBe('/contracts');
    expect(getLandingRoute(multi)).toBe('/');
    expect(getLandingRoute(none)).toBe('/forbidden');
  });
  it('module access', () => {
    expect(canAccessModule(ppaUser, 'legal')).toBe(false);
    expect(canAccessModule(admin, 'legal')).toBe(true);
    expect(getAccessibleModules(admin)).toEqual(['ppa', 'gc', 'legal']);
  });
  it('hasPermission', () => {
    expect(hasPermission(ppaUser, 'ppa', 'view')).toBe(true);
    expect(hasPermission(ppaUser, 'ppa', 'delete')).toBe(false);
    expect(hasPermission({ ...ppaUser, permissions: { ppa: ['view', 'edit'] } }, 'ppa', 'edit')).toBe(true);
    expect(hasPermission(ppaUser, 'gc', 'view')).toBe(false);
    expect(hasPermission(admin, 'gc', 'delete')).toBe(true);
  });
});
