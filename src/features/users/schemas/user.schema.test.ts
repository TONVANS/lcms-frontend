import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { DIVISIONS } from '../types';
import { emptyUserForm, userCreateSchema, userEditSchema } from './user.schema';

const V = lo.users.validation;
const msgs = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues.map((i) => i.message) ?? [];

describe('userCreateSchema', () => {
  it('requires employeeCode with a Lao message', () => {
    const r = userCreateSchema.safeParse(emptyUserForm());
    expect(r.success).toBe(false);
    expect(msgs(r)).toContain(V.required);
  });
  it('accepts a minimal valid form', () => {
    expect(userCreateSchema.safeParse({ ...emptyUserForm(), employeeCode: 'EDL-001' }).success).toBe(true);
  });
  it('rejects bad code, email, phone and unknown division', () => {
    expect(msgs(userCreateSchema.safeParse({ ...emptyUserForm(), employeeCode: 'a b' }))).toContain(
      V.employeeCodeFormat,
    );
    const r = userCreateSchema.safeParse({
      ...emptyUserForm(),
      employeeCode: 'E1',
      email: 'nope',
      phone: 'abc',
      division: 'x',
    });
    expect(msgs(r)).toEqual(expect.arrayContaining([V.emailInvalid, V.phoneInvalid, V.divisionInvalid]));
  });
  it('accepts every known division', () => {
    for (const d of DIVISIONS)
      expect(userCreateSchema.safeParse({ ...emptyUserForm(), employeeCode: 'E1', division: d }).success).toBe(true);
  });
});

describe('userEditSchema', () => {
  it('does not require employeeCode', () => {
    expect(userEditSchema.safeParse({ ...emptyUserForm(), employeeCode: '' }).success).toBe(true);
  });
});
