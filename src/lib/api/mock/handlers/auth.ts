import type MockAdapter from 'axios-mock-adapter';
import { MOCK_PASSWORD, MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { clearMockSession, readMockSession, setMockSession } from '@/lib/auth/session';
import { endpoints } from '../../endpoints';

function sessionUser() {
  const username = readMockSession();
  return username ? (MOCK_USERS.find((u) => u.username === username) ?? null) : null;
}

export function register(mock: MockAdapter): void {
  mock.onPost(endpoints.auth.login).reply((config) => {
    let body: { username?: string; password?: string; remember?: boolean } = {};
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {});
    } catch {
      body = {};
    }
    const user = MOCK_USERS.find((u) => u.username === body.username);
    if (!user || body.password !== MOCK_PASSWORD) {
      return [401, { code: 'INVALID_CREDENTIALS' }];
    }
    setMockSession(user.username, Boolean(body.remember));
    return [200, user];
  });

  mock.onGet(endpoints.auth.me).reply(() => {
    const user = sessionUser();
    return user ? [200, user] : [401, { code: 'UNAUTHENTICATED' }];
  });

  mock.onPost(endpoints.auth.logout).reply(() => {
    clearMockSession();
    return [204];
  });

  mock.onPost(endpoints.auth.refresh).reply(() =>
    sessionUser() ? [200] : [401, { code: 'UNAUTHENTICATED' }],
  );

  mock.onPost(endpoints.auth.forgotPassword).reply(204);
}
