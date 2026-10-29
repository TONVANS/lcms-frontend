import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { emptyGcForm, fromContract, gcFormSchema } from './gc.schema';

const valid = () => ({
  ...emptyGcForm(),
  title: 'T',
  contractTypeId: 1,
  contractNumber: 'N-1',
});

function issues(values: unknown) {
  const r = gcFormSchema.safeParse(values);
  return r.success ? [] : r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
}

describe('gcFormSchema', () => {
  it('accepts the minimal create body and defaults notifyDaysBefore to 60', () => {
    expect(issues(valid())).toEqual([]);
    expect(emptyGcForm().notifyDaysBefore).toBe(60);
  });

  it('requires title, contractTypeId, contractNumber', () => {
    const got = issues({ ...emptyGcForm() });
    expect(got.map((g) => g.path).sort()).toEqual(['contractNumber', 'contractTypeId', 'title']);
    expect(got.every((g) => g.message === lo.gc.validation.required)).toBe(true);
  });

  it('bounds sharePercentage 0..100 and integers >= 0', () => {
    expect(issues({ ...valid(), sharePercentage: 101 }).map((i) => i.path)).toEqual(['sharePercentage']);
    expect(issues({ ...valid(), sharePercentage: -1 }).map((i) => i.path)).toEqual(['sharePercentage']);
    expect(issues({ ...valid(), sharePercentage: 51.5 })).toEqual([]);
    expect(issues({ ...valid(), durationMonths: 1.5 }).map((i) => i.path)).toEqual(['durationMonths']);
    expect(issues({ ...valid(), notifyDaysBefore: -1 }).map((i) => i.path)).toEqual(['notifyDaysBefore']);
  });

  it('rejects an unknown currency', () => {
    expect(issues({ ...valid(), currency: 'EUR' }).map((i) => i.path)).toEqual(['currency']);
  });

  it('requires expiration >= effective when both are set', () => {
    const bad = issues({ ...valid(), effectiveDate: '2026-05-01', expirationDate: '2026-04-01' });
    expect(bad).toEqual([{ path: 'expirationDate', message: lo.gc.validation.endAfterEffective }]);
    expect(issues({ ...valid(), effectiveDate: '2026-05-01', expirationDate: '2026-05-01' })).toEqual([]);
    expect(issues({ ...valid(), effectiveDate: '', expirationDate: '2026-04-01' })).toEqual([]);
  });

  it('fromContract builds form values', () => {
    const f = fromContract({
      id: '1', title: 'A', contractTypeId: 2, contractType: null, contractNumber: 'N',
      durationText: null, durationMonths: 12, signedDate: '2026-01-01', effectiveDate: null,
      expirationDate: null, contractValue: 5, currency: 'USD', equityOrCapitalContribution: null,
      sharePercentage: null, implementer: null, additionalDetails: null, notifyDaysBefore: null,
      status: 'ACTIVE', createdAt: null, updatedAt: null,
    });
    expect(f.contractTypeId).toBe(2);
    expect(f.durationText).toBe('');
    expect(f.notifyDaysBefore).toBe(60);
    expect(f.currency).toBe('USD');
  });
});
