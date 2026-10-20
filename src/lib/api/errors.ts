import { isAxiosError } from 'axios';
import { lo } from '@/lib/i18n/lo';
import type { ApiError } from '@/types/api';

function isApiError(e: unknown): e is ApiError {
  if (typeof e !== 'object' || e === null || e instanceof Error) return false;
  const o = e as Record<string, unknown>;
  return typeof o.status === 'number' && typeof o.code === 'string' && typeof o.message === 'string';
}

export function normalizeError(e: unknown): ApiError {
  if (isApiError(e)) return e;
  if (isAxiosError(e)) {
    const res = e.response;
    if (!res) {
      if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
        return { status: 0, code: 'TIMEOUT', message: e.message };
      }
      return { status: 0, code: 'NETWORK', message: e.message };
    }
    const body = (typeof res.data === 'object' && res.data !== null ? res.data : {}) as {
      code?: string;
      message?: string;
      fieldErrors?: Record<string, string>;
    };
    const err: ApiError = {
      status: res.status,
      code: body.code ?? `HTTP_${res.status}`,
      message: body.message ?? '',
    };
    if (body.fieldErrors) err.fieldErrors = body.fieldErrors;
    return err;
  }
  return { status: 0, code: 'UNKNOWN', message: e instanceof Error ? e.message : '' };
}

export function toUserMessage(err: ApiError): string {
  if (err.code === 'NETWORK') return lo.errors.network;
  if (err.code === 'TIMEOUT') return lo.errors.timeout;
  if (err.code === 'INVALID_CREDENTIALS') return lo.errors.invalidCredentials;
  if (err.status === 401) return lo.auth.sessionExpired;
  if (err.status === 403) return lo.errors.forbidden;
  if (err.status === 404) return lo.errors.notFound;
  if ((err.status === 400 || err.status === 422) && err.message) return err.message;
  if (err.status >= 500) return lo.errors.server;
  return lo.errors.unknown;
}
