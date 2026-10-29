import axios, { type AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, setSessionToken } from '@/lib/auth/session';
import { endpoints } from './endpoints';
import { installInterceptors } from './interceptors';

let instance: AxiosInstance;
let mock: MockAdapter;
let onUnauthorized: ReturnType<typeof vi.fn<() => void>>;

beforeEach(() => {
  clearSession();
  instance = axios.create();
  mock = new MockAdapter(instance);
  onUnauthorized = vi.fn<() => void>();
  installInterceptors(instance, { onUnauthorized });
});
afterEach(() => {
  mock.restore();
  clearSession();
});

describe('installInterceptors', () => {
  it('adds a Bearer header when a session token exists', async () => {
    setSessionToken('tok.en.123', false);
    mock.onGet('/x').reply(200, {});
    await instance.get('/x');
    expect(mock.history.get[0]?.headers?.Authorization).toBe('Bearer tok.en.123');
  });

  it('sends no Authorization header without a token', async () => {
    mock.onGet('/x').reply(200, {});
    await instance.get('/x');
    expect(mock.history.get[0]?.headers?.Authorization).toBeUndefined();
  });

  it('calls onUnauthorized and rejects ApiError 401 on a 401', async () => {
    mock.onGet('/x').reply(401, { statusCode: 401, message: 'Unauthorized' });
    await expect(instance.get('/x')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('never calls the refresh endpoint', async () => {
    mock.onGet('/x').reply(401, {});
    await expect(instance.get('/x')).rejects.toBeTruthy();
    expect(mock.history.post).toHaveLength(0);
  });

  it('does not call onUnauthorized for a 401 from the login endpoint', async () => {
    mock
      .onPost(endpoints.auth.login)
      .reply(401, { statusCode: 401, message: 'Invalid credentials', error: 'Unauthorized' });
    await expect(instance.post(endpoints.auth.login, {})).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('rejects with normalized ApiError for non-401 errors', async () => {
    mock.onGet('/boom').reply(500);
    await expect(instance.get('/boom')).rejects.toMatchObject({ status: 500, code: 'HTTP_500' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
