import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { isAxiosError } from 'axios';
import { endpoints } from './endpoints';
import { normalizeError } from './errors';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const NO_REFRESH_URLS: string[] = [endpoints.auth.login, endpoints.auth.refresh];

/**
 * Installs the 401 -> refresh -> retry flow and error normalization.
 * Refresh state is scoped to this call. Returns an eject function.
 */
export function installInterceptors(
  instance: AxiosInstance,
  opts: { onUnauthorized: () => void },
): () => void {
  let refreshPromise: Promise<void> | null = null;

  const id = instance.interceptors.response.use(
    (res) => res,
    async (error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 401 && error.config) {
        const original = error.config as RetriableConfig;
        const url = original.url ?? '';
        if (!original._retry && !NO_REFRESH_URLS.includes(url)) {
          original._retry = true;
          if (!refreshPromise) {
            refreshPromise = instance
              .post(endpoints.auth.refresh)
              .then(() => undefined)
              .catch((e: unknown) => {
                opts.onUnauthorized();
                throw e;
              })
              .finally(() => {
                refreshPromise = null;
              });
          }
          try {
            await refreshPromise;
          } catch {
            throw normalizeError(error);
          }
          return instance(original);
        }
      }
      throw normalizeError(error);
    },
  );

  return () => instance.interceptors.response.eject(id);
}
