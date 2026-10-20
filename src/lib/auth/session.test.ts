import { afterEach, describe, expect, it } from 'vitest';
import { env } from '@/config/env';
import { clearMockSession, hasSessionHint, readMockSession, setMockSession } from './session';

describe('mock session', () => {
  it('sets, reads and clears', () => {
    setMockSession('admin', false);
    expect(readMockSession()).toBe('admin');
    clearMockSession();
    expect(readMockSession()).toBeNull();
  });
  it('remember persists with max-age', () => {
    setMockSession('bob', true);
    expect(readMockSession()).toBe('bob');
    clearMockSession();
  });
});

describe('hasSessionHint', () => {
  const original = env.NEXT_PUBLIC_API_MODE;
  afterEach(() => {
    env.NEXT_PUBLIC_API_MODE = original;
    clearMockSession();
  });

  it('mock mode follows the mock cookie', () => {
    env.NEXT_PUBLIC_API_MODE = 'mock';
    expect(hasSessionHint()).toBe(false);
    setMockSession('admin', false);
    expect(hasSessionHint()).toBe(true);
  });

  it('live mode is always true', () => {
    env.NEXT_PUBLIC_API_MODE = 'live';
    expect(hasSessionHint()).toBe(true);
  });
});
