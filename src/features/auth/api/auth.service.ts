import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { unwrap } from '@/lib/api/envelope';
import type { User } from '@/types/domain';
import { toUser } from '../lib/user-mapper';
import type { LoginInput } from '../schemas/login.schema';

function rec(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export const authService = {
  /** Backend login: `{ accessToken, user | userProfile }` (optionally wrapped in `{ data }`). */
  async login(input: LoginInput): Promise<{ token: string; user: User }> {
    // `remember` is client-only (cookie lifetime); the backend DTO has just these two fields.
    const { data } = await api.post<unknown>(endpoints.auth.login, {
      username: input.username,
      password: input.password,
    });
    const body = rec(data);
    const inner = rec(unwrap<unknown>(data));
    const token = body.accessToken ?? inner.accessToken;
    if (typeof token !== 'string' || token === '') throw new Error('Login response has no accessToken');
    const rawUser = body.user ?? body.userProfile ?? inner.user ?? inner.userProfile ?? rec(body.data).user;
    return { token, user: toUser(rawUser) };
  },
  async me(): Promise<User> {
    const { data } = await api.get<unknown>(endpoints.auth.me);
    return toUser(unwrap<unknown>(data));
  },
};
