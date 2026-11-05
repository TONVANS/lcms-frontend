import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { toStr, unwrap } from '@/lib/api/envelope';
import type { User } from '@/types/domain';
import { toUser } from '../lib/user-mapper';
import type { LoginInput } from '../schemas/login.schema';

function rec(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export const authService = {
  /** Backend login: `{ accessToken, refreshToken, user | userProfile }` (optionally wrapped in `{ data }`). */
  async login(input: LoginInput): Promise<{ token: string; refreshToken?: string; user: User }> {
    // `remember` is client-only (cookie lifetime); the backend DTO has just these two fields.
    const { data } = await api.post<unknown>(endpoints.auth.login, {
      username: input.username,
      password: input.password,
    });
    const body = rec(data);
    const inner = rec(unwrap<unknown>(data));
    const token = body.accessToken ?? inner.accessToken;
    if (typeof token !== 'string' || token === '') throw new Error('Login response has no accessToken');
    const refreshToken = toStr(body.refreshToken ?? inner.refreshToken) ?? undefined;
    const rawUser = body.user ?? body.userProfile ?? inner.user ?? inner.userProfile ?? rec(body.data).user;
    return { token, refreshToken, user: toUser(rawUser) };
  },

  async refresh(refreshToken: string): Promise<{ token: string; refreshToken?: string; user?: User }> {
    const { data } = await api.post<unknown>(endpoints.auth.refresh, { refreshToken });
    const body = rec(data);
    const inner = rec(unwrap<unknown>(data));
    const token = body.accessToken ?? inner.accessToken;
    if (typeof token !== 'string' || token === '') throw new Error('Refresh response has no accessToken');
    const newRefresh = toStr(body.refreshToken ?? inner.refreshToken) ?? undefined;
    const rawUser = body.user ?? body.userProfile ?? inner.user ?? inner.userProfile ?? rec(body.data).user;
    return { token, refreshToken: newRefresh, user: rawUser ? toUser(rawUser) : undefined };
  },

  async me(): Promise<User> {
    const { data } = await api.get<unknown>(endpoints.auth.me);
    return toUser(unwrap<unknown>(data));
  },
};
