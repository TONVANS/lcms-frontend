import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { User } from '@/types/domain';
import type { LoginInput } from '../schemas/login.schema';

export const authService = {
  async login(input: LoginInput): Promise<User> {
    const { data } = await api.post<User>(endpoints.auth.login, input);
    return data;
  },
  async logout(): Promise<void> {
    await api.post(endpoints.auth.logout);
  },
  async me(): Promise<User> {
    const { data } = await api.get<User>(endpoints.auth.me);
    return data;
  },
  async forgotPassword(body: { username: string }): Promise<void> {
    await api.post(endpoints.auth.forgotPassword, body);
  },
};
