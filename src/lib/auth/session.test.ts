import { afterEach, describe, expect, it } from 'vitest';
import {
  clearMockSession,
  clearSession,
  hasSessionHint,
  readMockSession,
  readSessionToken,
  readTokenExpiry,
  setMockSession,
  setSessionToken,
} from './session';

afterEach(() => clearSession());

function makeTestJwt(exp?: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(exp !== undefined ? { exp, sub: '123' } : { sub: '123' }));
  return `${header}.${payload}.signature`;
}

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

  it('caps max-age at token expiry when exp is present', () => {
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
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const jwt = makeTestJwt(futureExp);
      setSessionToken(jwt, true);
      const match = writes[0].match(/max-age=(\d+)/);
      expect(match).not.toBeNull();
      const maxAge = Number(match![1]);
      expect(maxAge).toBeGreaterThanOrEqual(3590);
      expect(maxAge).toBeLessThanOrEqual(3600);
    } finally {
      delete (document as unknown as Record<string, unknown>).cookie;
    }
  });
});

describe('readTokenExpiry', () => {
  it('returns null for empty, mock, or invalid tokens', () => {
    expect(readTokenExpiry('')).toBeNull();
    expect(readTokenExpiry('mock:admin')).toBeNull();
    expect(readTokenExpiry('invalid.token')).toBeNull();
    expect(readTokenExpiry('a.b.c')).toBeNull();
  });

  it('returns null when exp is not in payload', () => {
    const token = makeTestJwt(undefined);
    expect(readTokenExpiry(token)).toBeNull();
  });

  it('decodes numeric exp from payload', () => {
    const exp = 1761800000;
    const token = makeTestJwt(exp);
    expect(readTokenExpiry(token)).toBe(exp);
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
