import { describe, expect, it } from 'vitest';
import { ADMIN_NAV, COMMON_NAV, MODULE_NAV, getModuleFromPath, isNavItemActive } from './navigation';

describe('getModuleFromPath', () => {
  it('maps module routes', () => {
    expect(getModuleFromPath('/ppa/contracts/12')).toBe('ppa');
    expect(getModuleFromPath('/contracts/list')).toBe('gc');
    expect(getModuleFromPath('/legal')).toBe('legal');
  });
  it('returns null outside modules', () => {
    expect(getModuleFromPath('/')).toBeNull();
    expect(getModuleFromPath('/notifications')).toBeNull();
    expect(getModuleFromPath('/legalx')).toBeNull();
  });
});

describe('isNavItemActive', () => {
  it('matches children but not siblings or module roots', () => {
    expect(isNavItemActive('/ppa/contracts/12', '/ppa/contracts')).toBe(true);
    expect(isNavItemActive('/ppa/contracts', '/ppa')).toBe(false);
    expect(isNavItemActive('/ppa', '/ppa')).toBe(true);
    expect(isNavItemActive('/ppa/contracts-archive', '/ppa/contracts')).toBe(false);
  });
  it('matches GC contract detail /contracts/[id] to /contracts/list', () => {
    expect(isNavItemActive('/contracts/c-123', '/contracts/list')).toBe(true);
    expect(isNavItemActive('/contracts/new', '/contracts/list')).toBe(false);
    expect(isNavItemActive('/contracts/alerts', '/contracts/list')).toBe(false);
    expect(isNavItemActive('/contracts', '/contracts/list')).toBe(false);
  });
  it('highlights list items for detail routes', () => {
    expect(isNavItemActive('/ppa/contracts/abc', '/ppa/contracts')).toBe(true);
    expect(isNavItemActive('/legal/cases/case-9', '/legal/cases')).toBe(true);
    expect(isNavItemActive('/ppa/new', '/ppa/contracts')).toBe(false);
  });
  it('highlights admin and common pages by prefix', () => {
    expect(isNavItemActive('/admin/users', '/admin/users')).toBe(true);
    expect(isNavItemActive('/admin/users/42', '/admin/users')).toBe(true);
    expect(isNavItemActive('/notifications', '/notifications')).toBe(true);
    expect(isNavItemActive('/admin/departments', '/admin/users')).toBe(false);
  });
});

describe('MODULE_NAV', () => {
  it('has the expected items per module', () => {
    expect(MODULE_NAV.ppa.map((i) => i.key)).toEqual(['dashboard', 'contracts', 'create', 'alerts']);
    expect(MODULE_NAV.gc.map((i) => i.key)).toEqual(['dashboard', 'contracts', 'create', 'alerts']);
    expect(MODULE_NAV.legal.map((i) => i.key)).toEqual(['dashboard', 'regulations', 'cases', 'create']);
  });
  it('no longer links to /ppa/documents', () => {
    expect(MODULE_NAV.ppa.some((i) => i.href === '/ppa/documents')).toBe(false);
  });
  it('gates items by system module', () => {
    expect(MODULE_NAV.ppa.find((i) => i.key === 'contracts')?.systemModule).toBe('power-contracts');
    expect(MODULE_NAV.legal.find((i) => i.key === 'regulations')?.systemModule).toBe('legal-documents');
    expect(MODULE_NAV.legal.find((i) => i.key === 'cases')?.systemModule).toBe('legal-cases');
  });
});

describe('COMMON_NAV / ADMIN_NAV', () => {
  it('lists notifications (with unread count) and support', () => {
    expect(COMMON_NAV.map((i) => i.href)).toEqual(['/notifications', '/support']);
    expect(COMMON_NAV[0].countKey).toBe('unread');
  });
  it('lists the four admin pages', () => {
    expect(ADMIN_NAV.map((i) => i.href)).toEqual([
      '/admin/users',
      '/admin/audit-logs',
      '/admin/contract-types',
      '/admin/departments',
    ]);
  });
});

describe('legal nav', () => {
  it('legal nav lists dashboard, regulations, cases, create', () => {
    expect(MODULE_NAV.legal.map((i) => i.key)).toEqual(['dashboard', 'regulations', 'cases', 'create']);
    expect(MODULE_NAV.legal.find((i) => i.key === 'create')?.permission).toBe('create');
  });
  it('legal detail routes highlight their list item', () => {
    expect(isNavItemActive('/legal/regulations/reg-1', '/legal/regulations')).toBe(true);
    expect(isNavItemActive('/legal/cases/case-3', '/legal/cases')).toBe(true);
    expect(isNavItemActive('/legal/cases', '/legal')).toBe(false);
  });
});
