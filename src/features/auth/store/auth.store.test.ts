import { beforeEach, describe, expect, it } from 'vitest';
import { clearMockSession, readMockSession, setMockSession } from '@/lib/auth/session';
import { useAuthStore } from './auth.store';

const initial = { user: null, status: 'idle', endReason: null } as const;

beforeEach(() => {
  clearMockSession();
  useAuthStore.setState({ ...initial });
});

describe('auth store', () => {
  it('login stores the user and session', async () => {
    await useAuthStore
      .getState()
      .login({ username: 'ppa.user', password: 'password', remember: false });
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      user: { modules: ['ppa'] },
      endReason: null,
    });
    expect(readMockSession()).toBe('ppa.user');
  });

  it('login success resets endReason to null', async () => {
    useAuthStore.setState({ endReason: 'expired' });
    await useAuthStore.getState().login({ username: 'admin', password: 'password', remember: true });
    expect(useAuthStore.getState().endReason).toBeNull();
  });

  it('wrong password rejects with INVALID_CREDENTIALS and stays unauthenticated', async () => {
    await expect(
      useAuthStore.getState().login({ username: 'admin', password: 'nope', remember: false }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(readMockSession()).toBeNull();
  });

  it('fetchMe without session -> unauthenticated, no throw, endReason null', async () => {
    await expect(useAuthStore.getState().fetchMe()).resolves.toBeUndefined();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'unauthenticated',
      user: null,
      endReason: null,
    });
  });

  it('fetchMe with a valid cookie authenticates', async () => {
    setMockSession('admin', false);
    await useAuthStore.getState().fetchMe();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      user: { username: 'admin' },
    });
  });

  it('fetchMe with unknown username cookie -> unauthenticated, expired, cookie cleared', async () => {
    setMockSession('ghost', false);
    await useAuthStore.getState().fetchMe();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'unauthenticated',
      user: null,
      endReason: 'expired',
    });
    expect(readMockSession()).toBeNull();
  });

  it('logout clears user and cookie and sets endReason logout', async () => {
    await useAuthStore.getState().login({ username: 'admin', password: 'password', remember: false });
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'unauthenticated',
      user: null,
      endReason: 'logout',
    });
    expect(readMockSession()).toBeNull();
  });

  it('expire clears local state, cookie and sets endReason expired', async () => {
    await useAuthStore.getState().login({ username: 'admin', password: 'password', remember: false });
    useAuthStore.getState().expire();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'unauthenticated',
      user: null,
      endReason: 'expired',
    });
    expect(readMockSession()).toBeNull();
  });
});
