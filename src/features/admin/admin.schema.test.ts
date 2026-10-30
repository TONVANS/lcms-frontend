import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import {
  contractTypeSchema,
  departmentSchema,
  toContractTypePayload,
  toDepartmentPayload,
} from './admin.schema';

describe('contractTypeSchema', () => {
  it('requires nameLo with a Lao message', () => {
    const r = contractTypeSchema.safeParse({ nameLo: '  ', nameEn: '', isActive: true });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe(lo.contractTypes.form.required);
  });
  it('builds a payload that omits empty nameEn', () => {
    const v = contractTypeSchema.parse({ nameLo: ' ກ ', nameEn: ' ', isActive: false });
    expect(toContractTypePayload(v)).toEqual({ nameLo: 'ກ', isActive: false });
    expect(toContractTypePayload({ nameLo: 'ກ', nameEn: 'EN', isActive: true })).toEqual({
      nameLo: 'ກ',
      nameEn: 'EN',
      isActive: true,
    });
  });
});

describe('departmentSchema', () => {
  it('requires name', () => {
    const r = departmentSchema.safeParse({ name: '', code: '', isActive: true });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe(lo.departments.form.required);
  });
  it('omits empty code', () => {
    expect(toDepartmentPayload({ name: ' N ', code: '', isActive: true })).toEqual({
      name: 'N',
      isActive: true,
    });
    expect(toDepartmentPayload({ name: 'N', code: 'C1', isActive: true }).code).toBe('C1');
  });
});
