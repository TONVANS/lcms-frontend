import { afterEach, describe, expect, it } from 'vitest';
import {
  clearMockSession,
  clearSession,
  hasSessionHint,
  readMockSession,
  readSessionToken,
  setMockSession,
  setSessionToken,
} from './session';

afterEach(() => clearSession());

describe('session token', () => {
  it('sets, reads the raw value and clears', () => {
    expect(readSessionToken()).toBeNull();
    setSessionToken('aaa.bbb.ccc', false);
    expect(readSessionToken()).toBe('aaa.bbb.ccc');
    clearSession();
    expect(readSessionToken()).toBeNull();
  });

  it('round-trips values that need encoding', () => {
    setSessionToken('a b=c;d', false);
    expect(readSessionToken()).toBe('a b=c;d');
  });

  it('writes a Lax root-path cookie, with max-age only when remembered', () => {
    const writes: string[] = [];
    const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')!;
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => desc.get!.call(document),
      set: (v: string) => {
        writes.push(v);
        desc.set!.call(document, v);
      },
    });
    try {
      setSessionToken('t1', false);
      setSessionToken('t2', true);
      expect(writes[0]).toContain('lcms_session=t1');
      expect(writes[0]).toContain('path=/');
      expect(writes[0]).toContain('SameSite=Lax');
      expect(writes[0]).not.toContain('max-age');
      expect(writes[0]).not.toContain('Secure');
      expect(writes[1]).toContain('max-age=2592000');
    } finally {
      delete (document as unknown as Record<string, unknown>).cookie;
    }
  });
});

describe('mock session helpers', () => {
  it('sets, reads and clears', () => {
    setMockSession('admin', false);
    expect(readMockSession()).toBe('admin');
    expect(readSessionToken()).toBe('mock:admin');
    clearMockSession();
    expect(readMockSession()).toBeNull();
  });
  it('remember persists with max-age', () => {
    setMockSession('bob', true);
    expect(readMockSession()).toBe('bob');
    clearMockSession();
  });
  it('readMockSession ignores a live (non-mock) token', () => {
    setSessionToken('real.jwt.token', false);
    expect(readMockSession()).toBeNull();
  });
});

describe('hasSessionHint', () => {
  it('is false without a cookie and true with one, in any mode', () => {
    expect(hasSessionHint()).toBe(false);
    setSessionToken('x', false);
    expect(hasSessionHint()).toBe(true);
    clearSession();
    expect(hasSessionHint()).toBe(false);
  });
});
