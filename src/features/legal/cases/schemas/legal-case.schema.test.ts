import { describe, expect, it } from 'vitest';
import { emptyLegalCaseForm, fromLegalCase, legalCaseFormSchema } from './legal-case.schema';

const valid = { ...emptyLegalCaseForm(), caseCode: 'C-1', defendant: 'D', date: '2026-01-15' };
const ok = (o: object) => legalCaseFormSchema.safeParse({ ...valid, ...o }).success;

describe('legalCaseFormSchema', () => {
  it('accepts the required fields only', () => expect(ok({})).toBe(true));

  it.each(['caseCode', 'defendant', 'date'])('%s is required', (k) => {
    expect(ok({ [k]: ' ' })).toBe(false);
  });

  it('date must be a real calendar date', () => {
    expect(ok({ date: '2026-02-30' })).toBe(false);
    expect(ok({ date: '15/01/2026' })).toBe(false);
  });

  it('amounts must be non-negative numbers or null', () => {
    expect(ok({ damageLak: -1 })).toBe(false);
    expect(ok({ recoveredUsd: -0.01 })).toBe(false);
    expect(ok({ damageLak: 0, fineUsd: 12.5, recoveredLak: null })).toBe(true);
  });

  it('externalUrl is http or https only', () => {
    expect(ok({ externalUrl: 'javascript:alert(1)' })).toBe(false);
    expect(ok({ externalUrl: 'ftp://x.y' })).toBe(false);
    expect(ok({ externalUrl: 'http://x.y/z' })).toBe(true);
    expect(ok({ externalUrl: '' })).toBe(true);
  });

  it('rejects unknown enums', () => {
    expect(ok({ caseType: 'civil' })).toBe(false);
    expect(ok({ disputeStatus: 'first_instance' })).toBe(false);
  });

  it('fromLegalCase maps nulls to empty form values', () => {
    const f = fromLegalCase({
      id: '1', caseCode: 'C', defendant: 'D', allegation: null, departmentId: null, department: null,
      departmentAction: null, caseType: 'CIVIL', damageLak: null, damageUsd: 5, fineLak: null, fineUsd: null,
      totalDueLak: null, totalDueUsd: null, disputeStatus: 'APPEAL', recoveredLak: null, recoveredUsd: null,
      date: null, disputeProgress: null, externalUrl: null, createdAt: '', updatedAt: '',
    });
    expect(f).toMatchObject({ allegation: '', departmentId: '', date: '', damageUsd: 5, damageLak: null });
  });
});
