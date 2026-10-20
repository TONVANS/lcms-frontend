import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { loginSchema } from './login.schema';

describe('loginSchema', () => {
  it('reports both required messages', () => {
    const r = loginSchema.safeParse({ username: ' ', password: '' });
    expect(r.error?.issues.map((i) => i.message)).toEqual([
      lo.validation.usernameRequired,
      lo.validation.passwordRequired,
    ]);
  });

  it('trims username and defaults remember to false', () => {
    const r = loginSchema.parse({ username: ' admin ', password: 'x' });
    expect(r).toEqual({ username: 'admin', password: 'x', remember: false });
  });
});
