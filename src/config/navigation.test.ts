import { describe, expect, it } from 'vitest';
import { MODULE_NAV, getModuleFromPath, isNavItemActive } from './navigation';

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
});

describe('MODULE_NAV', () => {
  it('has the expected item counts', () => {
    expect(MODULE_NAV.ppa).toHaveLength(5);
    expect(MODULE_NAV.gc).toHaveLength(4);
    expect(MODULE_NAV.legal).toHaveLength(4);
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
