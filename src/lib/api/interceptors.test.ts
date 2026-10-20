import axios, { type AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { endpoints } from './endpoints';
import { installInterceptors } from './interceptors';

let instance: AxiosInstance;
let mock: MockAdapter;
let onUnauthorized: ReturnType<typeof vi.fn<() => void>>;

const refreshCalls = () => mock.history.post.filter((r) => r.url === endpoints.auth.refresh);

beforeEach(() => {
  instance = axios.create();
  mock = new MockAdapter(instance);
  onUnauthorized = vi.fn<() => void>();
  installInterceptors(instance, { onUnauthorized });
});
afterEach(() => mock.restore());

describe('installInterceptors', () => {
  it('refreshes once and retries the original request on 401', async () => {
    let calls = 0;
    mock.onGet('/x').reply(() => (++calls === 1 ? [401, {}] : [200, { ok: true }]));
    mock.onPost(endpoints.auth.refresh).reply(200);
    const res = await instance.get('/x');
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true });
    expect(refreshCalls()).toHaveLength(1);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('shares one refresh across concurrent 401s', async () => {
    const seen = new Map<string, number>();
    mock.onGet(/^\/p\d$/).reply((c) => {
      const u = c.url ?? '';
      const n = (seen.get(u) ?? 0) + 1;
      seen.set(u, n);
      return n === 1 ? [401, {}] : [200, { u }];
    });
    mock.onPost(endpoints.auth.refresh).reply(200);
    const results = await Promise.all([
      instance.get('/p1'),
      instance.get('/p2'),
      instance.get('/p3'),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(refreshCalls()).toHaveLength(1);
  });

  it('calls onUnauthorized once and rejects ApiError 401 when refresh fails', async () => {
    mock.onGet(/^\/p\d$/).reply(401, {});
    mock.onPost(endpoints.auth.refresh).reply(401, { code: 'EXPIRED' });
    const results = await Promise.allSettled([instance.get('/p1'), instance.get('/p2')]);
    for (const r of results) {
      expect(r.status).toBe('rejected');
      expect((r as PromiseRejectedResult).reason).toMatchObject({ status: 401 });
    }
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not refresh on 401 from /auth/login or /auth/refresh', async () => {
    mock.onPost(endpoints.auth.login).reply(401, { code: 'INVALID_CREDENTIALS', message: 'no' });
    mock.onPost(endpoints.auth.refresh).reply(401, { code: 'EXPIRED' });
    await expect(instance.post(endpoints.auth.login, {})).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });
    await expect(instance.post(endpoints.auth.refresh)).rejects.toMatchObject({
      status: 401,
      code: 'EXPIRED',
    });
    // only the explicit direct call; no automatic refresh was triggered
    expect(refreshCalls()).toHaveLength(1);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('rejects with normalized ApiError for non-401 errors', async () => {
    mock.onGet('/boom').reply(500);
    await expect(instance.get('/boom')).rejects.toMatchObject({ status: 500, code: 'HTTP_500' });
  });
});
