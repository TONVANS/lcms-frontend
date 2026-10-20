import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLogoutRegistry, registerLogoutReset, runLogoutResets } from './logout-registry';

describe('logout-registry', () => {
  beforeEach(() => {
    clearLogoutRegistry();
  });

  it('runs registered callbacks on logout', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    registerLogoutReset(fn1);
    registerLogoutReset(fn2);

    runLogoutResets();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('allows unregistering callbacks', () => {
    const fn = vi.fn();
    const unregister = registerLogoutReset(fn);
    unregister();

    runLogoutResets();
    expect(fn).not.toHaveBeenCalled();
  });

  it('continues executing if one callback throws', () => {
    const throwingFn = vi.fn(() => {
      throw new Error('reset error');
    });
    const normalFn = vi.fn();

    registerLogoutReset(throwingFn);
    registerLogoutReset(normalFn);

    expect(() => runLogoutResets()).not.toThrow();
    expect(normalFn).toHaveBeenCalledTimes(1);
  });
});
