import { isAxiosError, isCancel } from 'axios';
import { lo } from '@/lib/i18n/lo';
import type { ApiError } from '@/types/api';
import { endpoints } from './endpoints';

function isApiError(e: unknown): e is ApiError {
  if (typeof e !== 'object' || e === null || e instanceof Error) return false;
  const o = e as Record<string, unknown>;
  return typeof o.status === 'number' && typeof o.code === 'string' && typeof o.message === 'string';
}

export function isCanceledError(e: unknown): boolean {
  if (isCancel(e)) return true;
  if (typeof e === 'object' && e !== null) {
    const err = e as { code?: string; name?: string };
    return err.code === 'ERR_CANCELED' || err.name === 'CanceledError';
  }
  return false;
}

export function normalizeError(e: unknown): ApiError {
  if (isApiError(e)) return e;
  if (isCanceledError(e)) {
    const msg = e instanceof Error ? e.message : 'canceled';
    return { status: 0, code: 'ERR_CANCELED', message: msg };
  }
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
      message?: string | string[];
      fieldErrors?: Record<string, string>;
    };
    const url = (e.config?.url ?? '').split('?')[0];
    const message = Array.isArray(body.message)
      ? body.message.map(String).join('\n')
      : typeof body.message === 'string'
        ? body.message
        : '';
    const code =
      typeof body.code === 'string'
        ? body.code
        : res.status === 401 && url === endpoints.auth.login
          ? 'INVALID_CREDENTIALS'
          : `HTTP_${res.status}`;
    const err: ApiError = { status: res.status, code, message };
    if (body.fieldErrors) err.fieldErrors = body.fieldErrors;
    return err;
  }
  return { status: 0, code: 'UNKNOWN', message: e instanceof Error ? e.message : '' };
}

export function toUserMessage(err: ApiError): string {
  if (err.code === 'ERR_CANCELED') return '';
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
