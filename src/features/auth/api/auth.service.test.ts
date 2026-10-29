import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { authService } from './auth.service';

const rawUser = {
  id: 7,
  username: 'gc.user',
  fullName: 'F',
  role: 'MAIN_USER',
  accessibleModules: ['contracts'],
};

afterEach(() => vi.restoreAllMocks());

describe('authService', () => {
  it('login reads accessToken and user', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { accessToken: 'tok', user: rawUser } });
    const r = await authService.login({ username: 'gc.user', password: 'x', remember: false });
    expect(r.token).toBe('tok');
    expect(r.user).toMatchObject({ id: '7', role: 'MAIN_USER', accessibleModules: ['contracts'] });
  });

  it('login accepts userProfile', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { accessToken: 'tok', userProfile: rawUser } });
    expect((await authService.login({ username: 'a', password: 'b', remember: false })).user.id).toBe('7');
  });

  it('login accepts a { data } envelope with data.user', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { accessToken: 'tok2', user: rawUser } } });
    const r = await authService.login({ username: 'a', password: 'b', remember: false });
    expect(r.token).toBe('tok2');
    expect(r.user.username).toBe('gc.user');
  });

  it('login does not send the remember flag to the server', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { accessToken: 't', user: rawUser } });
    await authService.login({ username: 'a', password: 'b', remember: true });
    expect(post.mock.calls[0][1]).toEqual({ username: 'a', password: 'b' });
  });

  it('login without a token throws', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { user: rawUser } });
    await expect(authService.login({ username: 'a', password: 'b', remember: false })).rejects.toBeTruthy();
  });

  it('me unwraps { data } and maps', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: rawUser } });
    expect(await authService.me()).toMatchObject({ id: '7', role: 'MAIN_USER' });
  });

  it('has no logout / forgotPassword calls', () => {
    expect('logout' in authService).toBe(false);
    expect('forgotPassword' in authService).toBe(false);
  });
});
