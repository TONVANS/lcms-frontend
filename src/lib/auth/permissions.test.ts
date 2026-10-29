import { describe, expect, it } from 'vitest';
import type { Permission, SystemModule, User } from '@/types/domain';
import {
  canAccessModule,
  getAccessibleModules,
  getLandingRoute,
  hasPermission,
  hasSystemModule,
  isAdmin,
} from './permissions';

const base: User = {
  id: '1',
  employeeCode: 'E001',
  username: 't',
  fullName: 'T',
  email: null,
  phone: null,
  department: null,
  division: null,
  position: null,
  role: 'VIEWER',
  canView: false,
  canUpload: false,
  canEdit: false,
  canDelete: false,
  canDownload: false,
  accessibleModules: [],
};
const mk = (over: Partial<User>): User => ({ ...base, ...over });

const ALL_PERMS: Permission[] = ['view', 'create', 'edit', 'delete', 'download'];
const ALL_SYSTEM: SystemModule[] = [
  'contracts',
  'contract-types',
  'legal-documents',
  'legal-cases',
  'power-contracts',
  'power-notifications',
  'departments',
  'support',
  'users',
  'audit-logs',
];

const admin = mk({ role: 'ADMIN', accessibleModules: ALL_SYSTEM });
const gcMain = mk({ role: 'MAIN_USER', accessibleModules: ['contracts', 'departments', 'support'] });
const legalMain = mk({ role: 'MAIN_USER', accessibleModules: ['legal-documents', 'departments'] });
const legalCasesOnly = mk({ role: 'VIEWER', canView: true, accessibleModules: ['legal-cases'] });
const ppaMain = mk({ role: 'MAIN_USER', accessibleModules: ['power-contracts', 'power-notifications'] });
const gcEditor = mk({
  role: 'EDITOR',
  canView: true,
  canUpload: true,
  canEdit: true,
  canDelete: true,
  canDownload: false,
  accessibleModules: ['contracts'],
});
const gcViewer = mk({ role: 'VIEWER', canView: true, accessibleModules: ['contracts'] });
const none = mk({ role: 'VIEWER', canView: true, accessibleModules: ['departments', 'support'] });
const multi = mk({ role: 'MAIN_USER', accessibleModules: ['contracts', 'power-contracts'] });

describe('isAdmin / hasSystemModule', () => {
  it('only ADMIN is admin', () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(gcMain)).toBe(false);
    expect(isAdmin(gcEditor)).toBe(false);
  });
  it('ADMIN has every system module; others only their list', () => {
    expect(hasSystemModule(mk({ role: 'ADMIN' }), 'audit-logs')).toBe(true);
    expect(hasSystemModule(gcMain, 'contracts')).toBe(true);
    expect(hasSystemModule(gcMain, 'users')).toBe(false);
    expect(hasSystemModule(none, 'support')).toBe(true);
  });
});

describe('getAccessibleModules / canAccessModule', () => {
  it('derives UI modules in canonical order', () => {
    expect(getAccessibleModules(admin)).toEqual(['ppa', 'gc', 'legal']);
    expect(getAccessibleModules(gcMain)).toEqual(['gc']);
    expect(getAccessibleModules(ppaMain)).toEqual(['ppa']);
    expect(getAccessibleModules(multi)).toEqual(['ppa', 'gc']);
  });
  it('legal is reachable via either legal-documents or legal-cases', () => {
    expect(getAccessibleModules(legalMain)).toEqual(['legal']);
    expect(getAccessibleModules(legalCasesOnly)).toEqual(['legal']);
    expect(canAccessModule(legalCasesOnly, 'legal')).toBe(true);
    expect(canAccessModule(legalMain, 'legal')).toBe(true);
  });
  it('no business module -> no UI modules', () => {
    expect(getAccessibleModules(none)).toEqual([]);
    expect(canAccessModule(none, 'gc')).toBe(false);
    expect(canAccessModule(gcMain, 'legal')).toBe(false);
    expect(canAccessModule(admin, 'legal')).toBe(true);
  });
});

describe('hasPermission', () => {
  it('ADMIN has every permission in every module', () => {
    for (const m of ['ppa', 'gc', 'legal'] as const)
      for (const p of ALL_PERMS) expect(hasPermission(admin, m, p)).toBe(true);
  });
  it('MAIN_USER has all permissions in own module only', () => {
    for (const p of ALL_PERMS) {
      expect(hasPermission(gcMain, 'gc', p)).toBe(true);
      expect(hasPermission(gcMain, 'ppa', p)).toBe(false);
      expect(hasPermission(gcMain, 'legal', p)).toBe(false);
    }
  });
  it('EDITOR maps flags to permissions', () => {
    expect(hasPermission(gcEditor, 'gc', 'view')).toBe(true);
    expect(hasPermission(gcEditor, 'gc', 'create')).toBe(true);
    expect(hasPermission(gcEditor, 'gc', 'edit')).toBe(true);
    expect(hasPermission(gcEditor, 'gc', 'delete')).toBe(true);
    expect(hasPermission(gcEditor, 'gc', 'download')).toBe(false);
    expect(hasPermission(gcEditor, 'ppa', 'view')).toBe(false);
  });
  it('VIEWER only holds what its flags grant', () => {
    expect(hasPermission(gcViewer, 'gc', 'view')).toBe(true);
    for (const p of ['create', 'edit', 'delete', 'download'] as const)
      expect(hasPermission(gcViewer, 'gc', p)).toBe(false);
  });
  it('legal permissions work through legal-cases alone', () => {
    expect(hasPermission(legalCasesOnly, 'legal', 'view')).toBe(true);
    expect(hasPermission(legalCasesOnly, 'legal', 'edit')).toBe(false);
  });
  it('a user with flags but no module gets nothing', () => {
    expect(hasPermission(none, 'gc', 'view')).toBe(false);
  });
});

describe('getLandingRoute', () => {
  it('routes by module count', () => {
    expect(getLandingRoute(admin)).toBe('/');
    expect(getLandingRoute(multi)).toBe('/');
    expect(getLandingRoute(gcMain)).toBe('/contracts');
    expect(getLandingRoute(ppaMain)).toBe('/ppa');
    expect(getLandingRoute(legalMain)).toBe('/legal');
    expect(getLandingRoute(legalCasesOnly)).toBe('/legal');
    expect(getLandingRoute(none)).toBe('/support');
  });
});
