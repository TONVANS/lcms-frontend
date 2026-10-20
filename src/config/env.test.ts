import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('applies defaults', () => {
    expect(parseEnv({})).toEqual({
      NEXT_PUBLIC_APP_NAME: 'LCMS',
      NEXT_PUBLIC_API_MODE: 'mock',
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8080/api/v1',
      NEXT_PUBLIC_MAX_UPLOAD_MB: 50,
    });
    expect(parseEnv({}).NEXT_PUBLIC_API_MODE).toBe('mock');
  });
  it('coerces upload size to a number', () => {
    expect(parseEnv({ NEXT_PUBLIC_MAX_UPLOAD_MB: '20' }).NEXT_PUBLIC_MAX_UPLOAD_MB).toBe(20);
  });
  it('throws on invalid mode', () => {
    expect(() => parseEnv({ NEXT_PUBLIC_API_MODE: 'bogus' })).toThrow();
  });
});
