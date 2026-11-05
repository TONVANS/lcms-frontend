import axios, { type AxiosInstance, isAxiosError } from 'axios';
import { env } from '@/config/env';
import { readRefreshToken, readSessionToken, setSessionTokens } from '@/lib/auth/session';
import { endpoints } from './endpoints';
import { normalizeError } from './errors';

let refreshPromise: Promise<string | null> | null = null;

/**
 * Installs the Bearer request interceptor and the response error normalization.
 * A 401 with code `TOKEN_OUTDATED` triggers seamless token refresh without logging out.
 * Other 401 errors trigger `onUnauthorized()`.
 */
export function installInterceptors(
  instance: AxiosInstance,
  opts: {
    onUnauthorized: () => void;
    onTokenRefreshed?: (newToken: string, rawUser?: unknown) => void;
  },
): () => void {
  const reqId = instance.interceptors.request.use((config) => {
    const token = readSessionToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  const resId = instance.interceptors.response.use(
    (res) => res,
    async (error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        const url = (error.config?.url ?? '').split('?')[0];
        const isAuthEndpoint =
          url === endpoints.auth.login || url === endpoints.auth.refresh;

        const errCode = (error.response.data as { code?: string })?.code;
        const errMsg = String((error.response.data as { message?: unknown })?.message ?? '');
        const isTokenOutdated =
          errCode === 'TOKEN_OUTDATED' ||
          errMsg.toUpperCase().includes('TOKEN_OUTDATED') ||
          errMsg.includes('tokenVersion');

        if (!isAuthEndpoint && isTokenOutdated) {
          const refreshToken = readRefreshToken();
          if (refreshToken) {
            try {
              if (!refreshPromise) {
                refreshPromise = (async () => {
                  const res = await axios.post<{
                    accessToken?: string;
                    refreshToken?: string;
                    user?: unknown;
                    data?: { accessToken?: string; refreshToken?: string; user?: unknown };
                  }>(`${env.NEXT_PUBLIC_API_BASE_URL}${endpoints.auth.refresh}`, {
                    refreshToken,
                  });
                  const body = res.data;
                  const inner = body?.data ?? {};
                  const newAccess = body?.accessToken || inner.accessToken;
                  const newRefresh = body?.refreshToken || inner.refreshToken || refreshToken;
                  const rawUser = body?.user || inner.user;
                  if (newAccess) {
                    setSessionTokens({ accessToken: newAccess, refreshToken: newRefresh });
                    opts.onTokenRefreshed?.(newAccess, rawUser);
                    return newAccess;
                  }
                  return null;
                })().finally(() => {
                  refreshPromise = null;
                });
              }

              const newAccess = await refreshPromise;
              if (newAccess && error.config) {
                error.config.headers.set('Authorization', `Bearer ${newAccess}`);
                return instance.request(error.config);
              }
            } catch {
              refreshPromise = null;
              opts.onUnauthorized();
              throw normalizeError(error);
            }
          }
        }

        if (!isAuthEndpoint) {
          opts.onUnauthorized();
        }
      }
      throw normalizeError(error);
    },
  );

  return () => {
    instance.interceptors.request.eject(reqId);
    instance.interceptors.response.eject(resId);
  };
}
