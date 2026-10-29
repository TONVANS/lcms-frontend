import type MockAdapter from 'axios-mock-adapter';
import { MOCK_PASSWORD, MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

const unauthorized = (message: string): [number, unknown] => [
  401,
  { statusCode: 401, message, error: 'Unauthorized' },
];

/** Mirrors the live envelope. The store (not the server) writes the session cookie. */
export function register(mock: MockAdapter): void {
  mock.onPost(endpoints.auth.login).reply((config) => {
    let body: { username?: string; password?: string } = {};
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {});
    } catch {
      body = {};
    }
    const user = MOCK_USERS.find((u) => u.username === body.username);
    if (!user || body.password !== MOCK_PASSWORD) {
      return unauthorized('Invalid credentials');
    }
    return [200, { accessToken: `mock:${user.username}`, user }];
  });

  mock.onGet(endpoints.auth.me).reply(() => {
    const user = getMockSessionUser();
    return user ? [200, { data: user }] : unauthorized('Unauthorized');
  });
}
