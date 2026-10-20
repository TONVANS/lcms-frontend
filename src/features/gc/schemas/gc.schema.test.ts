import { describe, expect, it } from 'vitest';
import type { GeneralContract } from '../types';
import { emptyGcForm, fromGcContract, gcFormSchema, toGcPayload } from './gc.schema';

const base = {
  ...emptyGcForm(),
  title: 'T',
  contractNo: 'GC-1',
  signedDate: '2026-01-01',
  effectiveDate: '2026-01-02',
};

function issuePath(r: ReturnType<typeof gcFormSchema.safeParse>) {
  return r.success ? null : r.error.issues[0].path;
}

function toContract(p: ReturnType<typeof toGcPayload>): GeneralContract {
  return { ...p, id: '1', createdAt: '', updatedAt: '', createdBy: 'u' };
}

describe('gcFormSchema', () => {
  it('accepts a minimal valid form', () => {
    expect(gcFormSchema.safeParse(base).success).toBe(true);
  });

  it('requires title, contractNo and dates', () => {
    expect(gcFormSchema.safeParse({ ...base, title: ' ' }).success).toBe(false);
    expect(gcFormSchema.safeParse({ ...base, contractNo: '' }).success).toBe(false);
    expect(gcFormSchema.safeParse({ ...base, signedDate: '' }).success).toBe(false);
    expect(gcFormSchema.safeParse({ ...base, effectiveDate: '' }).success).toBe(false);
  });

  it('limits title and notes length', () => {
    expect(gcFormSchema.safeParse({ ...base, title: 'a'.repeat(300) }).success).toBe(true);
    expect(gcFormSchema.safeParse({ ...base, title: 'a'.repeat(301) }).success).toBe(false);
    expect(gcFormSchema.safeParse({ ...base, notes: 'a'.repeat(2000) }).success).toBe(true);
    expect(gcFormSchema.safeParse({ ...base, notes: 'a'.repeat(2001) }).success).toBe(false);
  });

  it('requires endDate after effectiveDate, error on endDate', () => {
    expect(issuePath(gcFormSchema.safeParse({ ...base, endDate: '2026-01-02' }))).toEqual(['endDate']);
    expect(gcFormSchema.safeParse({ ...base, endDate: '2026-01-03' }).success).toBe(true);
    expect(gcFormSchema.safeParse({ ...base, endDate: null }).success).toBe(true);
  });

  it('validates equity percent range', () => {
    expect(gcFormSchema.safeParse({ ...base, equity: { kind: 'percent', percent: 101 } }).success).toBe(false);
    expect(gcFormSchema.safeParse({ ...base, equity: { kind: 'percent', percent: 100 } }).success).toBe(true);
    expect(gcFormSchema.safeParse({ ...base, equity: { kind: 'percent', percent: 0 } }).success).toBe(false);
  });

  it('validates equity amount and value', () => {
    const money = (amount: number) => ({ amount, currency: 'USD' as const });
    expect(gcFormSchema.safeParse({ ...base, equity: { kind: 'amount', money: money(0) } }).success).toBe(false);
    expect(gcFormSchema.safeParse({ ...base, equity: { kind: 'amount', money: money(5) } }).success).toBe(true);
    expect(gcFormSchema.safeParse({ ...base, value: money(0) }).success).toBe(false);
    expect(gcFormSchema.safeParse({ ...base, value: money(5) }).success).toBe(true);
  });

  it('restricts currency to GC currencies', () => {
    expect(gcFormSchema.safeParse({ ...base, value: { amount: 5, currency: 'THB' } }).success).toBe(false);
  });
});

describe('payload mapping', () => {
  it('emits explicit nulls for cleared optionals (Review Focus 4)', () => {
    const p = toGcPayload({ ...base, counterparty: '  ', value: null, equity: null, endDate: null });
    expect(p).toMatchObject({ counterparty: null, value: null, equity: null, endDate: null });
    expect(Object.keys(p)).toEqual(
      expect.arrayContaining(['value', 'equity', 'endDate', 'counterparty', 'termText', 'implementer', 'notes']),
    );
    expect(fromGcContract(toContract(p))).toMatchObject({ counterparty: '', notes: '' });
  });

  it('trims strings', () => {
    const p = toGcPayload({ ...base, title: ' T ', contractNo: ' GC-1 ', notes: ' n ' });
    expect(p).toMatchObject({ title: 'T', contractNo: 'GC-1', notes: 'n' });
  });
});
