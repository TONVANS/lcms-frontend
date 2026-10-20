import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { normalizeError, toUserMessage } from './errors';

const config = { headers: {} } as InternalAxiosRequestConfig;

function withResponse(status: number, data?: unknown): AxiosError {
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('fail', 'ERR_BAD_RESPONSE', config, null, response);
}

describe('normalizeError', () => {
  it('maps no-response errors to NETWORK', () => {
    const e = new AxiosError('Network Error', 'ERR_NETWORK', config);
    expect(normalizeError(e)).toMatchObject({ status: 0, code: 'NETWORK' });
  });
  it('maps ECONNABORTED and ETIMEDOUT to TIMEOUT', () => {
    expect(normalizeError(new AxiosError('t', 'ECONNABORTED', config))).toMatchObject({
      status: 0,
      code: 'TIMEOUT',
    });
    expect(normalizeError(new AxiosError('t', 'ETIMEDOUT', config))).toMatchObject({
      status: 0,
      code: 'TIMEOUT',
    });
  });
  it('maps a 422 body', () => {
    const e = withResponse(422, { code: 'VALIDATION', message: 'x', fieldErrors: { name: 'y' } });
    expect(normalizeError(e)).toEqual({
      status: 422,
      code: 'VALIDATION',
      message: 'x',
      fieldErrors: { name: 'y' },
    });
  });
  it('falls back to HTTP_<status> without a body', () => {
    expect(normalizeError(withResponse(500))).toMatchObject({ status: 500, code: 'HTTP_500' });
  });
  it('passes through an existing ApiError', () => {
    const err = { status: 401, code: 'X', message: 'm' };
    expect(normalizeError(err)).toEqual(err);
  });
  it('maps unknown values to UNKNOWN', () => {
    expect(normalizeError(new Error('boom'))).toMatchObject({ status: 0, code: 'UNKNOWN' });
  });
});

describe('toUserMessage', () => {
  it('maps codes and statuses to Lao messages', () => {
    expect(toUserMessage({ status: 0, code: 'NETWORK', message: '' })).toBe(lo.errors.network);
    expect(toUserMessage({ status: 0, code: 'TIMEOUT', message: '' })).toBe(lo.errors.timeout);
    expect(toUserMessage({ status: 401, code: 'INVALID_CREDENTIALS', message: '' })).toBe(
      lo.errors.invalidCredentials,
    );
    expect(toUserMessage({ status: 401, code: 'HTTP_401', message: '' })).toBe(
      lo.auth.sessionExpired,
    );
    expect(toUserMessage({ status: 403, code: 'HTTP_403', message: '' })).toBe(
      lo.errors.forbidden,
    );
    expect(toUserMessage({ status: 404, code: 'HTTP_404', message: '' })).toBe(lo.errors.notFound);
    expect(toUserMessage({ status: 422, code: 'VALIDATION', message: 'bad' })).toBe('bad');
    expect(toUserMessage({ status: 400, code: 'HTTP_400', message: '' })).toBe(lo.errors.unknown);
    expect(toUserMessage({ status: 503, code: 'HTTP_503', message: '' })).toBe(lo.errors.server);
    expect(toUserMessage({ status: 418, code: 'HTTP_418', message: '' })).toBe(lo.errors.unknown);
  });
});
