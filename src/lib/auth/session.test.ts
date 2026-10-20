import { describe, expect, it } from 'vitest';
import { clearMockSession, readMockSession, setMockSession } from './session';

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
