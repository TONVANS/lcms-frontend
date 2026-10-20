import { describe, expect, it } from 'vitest';
import type { ModuleKey, User } from '@/types/domain';
import { ROLE_PERMISSIONS } from './roles';
import { canAccessModule, getAccessibleModules, getLandingRoute, getModuleRole, hasPermission } from './permissions';

const base: User = {
  id: '1',
  fullName: 'T',
  username: 't',
  email: 't@x.la',
  role: 'user',
  departmentId: 'd',
  departmentName: 'D',
  modules: [],
  moduleRoles: {},
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
    expect(hasPermission({ ...ppaUser, moduleRoles: { ppa: 'editor' } }, 'ppa', 'edit')).toBe(true);
    expect(hasPermission(ppaUser, 'gc', 'view')).toBe(false);
    expect(hasPermission(admin, 'gc', 'delete')).toBe(true);
  });
  it('role-based permissions', () => {
    const gcViewer: User = { ...gcUser, moduleRoles: { gc: 'viewer' } };
    const gcEditor: User = { ...gcUser, moduleRoles: { gc: 'editor' } };
    const gcMain: User = { ...gcUser, moduleRoles: { gc: 'main' } };
    const multiRoles: User = { ...mk(['ppa', 'gc']), moduleRoles: { ppa: 'viewer', gc: 'editor' } };
    expect(ROLE_PERMISSIONS.editor).not.toContain('download');
    expect(hasPermission(gcViewer, 'gc', 'edit')).toBe(false);
    expect(hasPermission(gcEditor, 'gc', 'delete')).toBe(true);
    expect(hasPermission(gcEditor, 'gc', 'download')).toBe(false);
    expect(hasPermission(gcMain, 'gc', 'download')).toBe(true);
    expect(hasPermission(gcMain, 'ppa', 'view')).toBe(false);
    expect(hasPermission({ ...gcViewer, moduleRoles: {} }, 'gc', 'view')).toBe(true);
    expect(hasPermission({ ...gcViewer, moduleRoles: {} }, 'gc', 'edit')).toBe(false);
    expect(hasPermission(admin, 'legal', 'download')).toBe(true);
    expect(getModuleRole(multiRoles, 'gc')).toBe('editor');
    expect(getModuleRole(multiRoles, 'legal')).toBeNull();
    expect(getModuleRole(admin, 'gc')).toBe('main');
    expect(getModuleRole({ ...gcViewer, moduleRoles: {} }, 'gc')).toBe('viewer');
  });
});
