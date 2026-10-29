import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '@/config/env';
import { api } from '@/lib/api/client';
import { clearMockSession, readMockSession, readSessionToken, setMockSession, setSessionToken } from '@/lib/auth/session';
import { MOCK_USERS } from '../mocks/auth.mock';
import { authService } from '../api/auth.service';
import { useAuthStore } from './auth.store';

const initial = { user: null, status: 'idle', endReason: null, error: null } as const;

afterEach(() => {
  vi.restoreAllMocks();
});

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
      user: { accessibleModules: ['power-contracts', 'power-notifications', 'departments', 'support'] },
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

  it('fetchMe without cookie leaves a prior endReason unchanged', async () => {
    useAuthStore.setState({ endReason: 'logout' });
    await useAuthStore.getState().fetchMe();
    expect(useAuthStore.getState().endReason).toBe('logout');
  });

  it('live mode: fetchMe calls /auth/me when a session token cookie exists', async () => {
    setSessionToken('live.jwt.token', false);
    const original = env.NEXT_PUBLIC_API_MODE;
    env.NEXT_PUBLIC_API_MODE = 'live';
    try {
      const me = vi.spyOn(authService, 'me').mockResolvedValue(MOCK_USERS[0]);
      await useAuthStore.getState().fetchMe();
      expect(me).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().status).toBe('authenticated');
    } finally {
      env.NEXT_PUBLIC_API_MODE = original;
    }
  });

  it('live mode: fetchMe without a session token skips /auth/me', async () => {
    const original = env.NEXT_PUBLIC_API_MODE;
    env.NEXT_PUBLIC_API_MODE = 'live';
    try {
      const me = vi.spyOn(authService, 'me');
      await useAuthStore.getState().fetchMe();
      expect(me).not.toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('unauthenticated');
    } finally {
      env.NEXT_PUBLIC_API_MODE = original;
    }
  });

  it('login with remember stores the token cookie', async () => {
    await useAuthStore.getState().login({ username: 'gc.user', password: 'password', remember: true });
    expect(readSessionToken()).toBe('mock:gc.user');
  });

  it('stale cookie: a single unauthenticated transition, endReason expired', async () => {
    setMockSession('ghost', false);
    const seen: string[] = [];
    const unsub = useAuthStore.subscribe((s) => seen.push(s.status));
    await useAuthStore.getState().fetchMe();
    unsub();
    expect(seen.filter((s) => s === 'unauthenticated')).toHaveLength(1);
    expect(useAuthStore.getState().endReason).toBe('expired');
  });

  it('network error on /auth/me -> status error, session kept', async () => {
    setMockSession('admin', false);
    useAuthStore.setState({ user: MOCK_USERS[0], endReason: null });
    vi.spyOn(authService, 'me').mockRejectedValue({ status: 0, code: 'NETWORK', message: 'x' });
    await useAuthStore.getState().fetchMe();
    const s = useAuthStore.getState();
    expect(s.status).toBe('error');
    expect(s.error?.code).toBe('NETWORK');
    expect(s.user).toEqual(MOCK_USERS[0]);
    expect(s.endReason).toBeNull();
    expect(readMockSession()).toBe('admin');
  });

  it('logout makes no API call', async () => {
    setMockSession('admin', false);
    useAuthStore.setState({ user: MOCK_USERS[0], status: 'authenticated' });
    const post = vi.spyOn(api, 'post');
    await useAuthStore.getState().logout();
    expect(post).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'unauthenticated',
      user: null,
      endReason: 'logout',
    });
    expect(readMockSession()).toBeNull();
  });

  it('expire while loading does nothing', () => {
    useAuthStore.setState({ status: 'loading' });
    useAuthStore.getState().expire();
    expect(useAuthStore.getState()).toMatchObject({ status: 'loading', endReason: null });
  });
});
