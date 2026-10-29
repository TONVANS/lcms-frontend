import type { AxiosInstance } from 'axios';
import { isAxiosError } from 'axios';
import { readSessionToken } from '@/lib/auth/session';
import { endpoints } from './endpoints';
import { normalizeError } from './errors';

/**
 * Installs the Bearer request interceptor and the response error normalization.
 * A 401 calls `onUnauthorized()` unless the request was the login call. There is
 * no refresh flow (the backend has none). Returns an eject function.
 */
export function installInterceptors(
  instance: AxiosInstance,
  opts: { onUnauthorized: () => void },
): () => void {
  const reqId = instance.interceptors.request.use((config) => {
    const token = readSessionToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  const resId = instance.interceptors.response.use(
    (res) => res,
    (error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        const url = (error.config?.url ?? '').split('?')[0];
        if (url !== endpoints.auth.login) opts.onUnauthorized();
      }
      throw normalizeError(error);
    },
  );

  return () => {
    instance.interceptors.request.eject(reqId);
    instance.interceptors.response.eject(resId);
  };
}
