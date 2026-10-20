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
});

describe('MODULE_NAV', () => {
  it('has the expected item counts', () => {
    expect(MODULE_NAV.ppa).toHaveLength(5);
    expect(MODULE_NAV.gc).toHaveLength(4);
    expect(MODULE_NAV.legal).toHaveLength(6);
  });
});
