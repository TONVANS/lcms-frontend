import { describe, expect, it } from 'vitest';
import type { GeneralContract } from '../types';
import { lo } from '@/lib/i18n/lo';
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

function messages(input: unknown): Map<string, string> {
  const r = gcFormSchema.safeParse(input);
  const m = new Map<string, string>();
  if (!r.success) for (const i of r.error.issues) if (!m.has(i.path.join('.'))) m.set(i.path.join('.'), i.message);
  return m;
}

describe('gcFormSchema review fixes', () => {
  const v = lo.gc.validation;

  it('rejects malformed and impossible dates with a Lao message', () => {
    expect(messages({ ...base, signedDate: '01/02/2026' }).get('signedDate')).toBe(v.dateInvalid);
    expect(messages({ ...base, effectiveDate: '2026-02-30' }).get('effectiveDate')).toBe(v.dateInvalid);
    expect(messages({ ...base, endDate: 'soon' }).get('endDate')).toBe(v.dateInvalid);
    expect(messages({ ...base, signedDate: '' }).get('signedDate')).toBe(v.required);
  });

  it('reports the date order together with other field errors', () => {
    const m = messages({ ...base, title: '', effectiveDate: '2026-05-01', endDate: '2026-04-01' });
    expect(m.get('title')).toBe(v.required);
    expect(m.get('endDate')).toBe(v.endAfterEffective);
  });

  it('does not report an order error when a date is malformed', () => {
    const m = messages({ ...base, effectiveDate: 'x', endDate: '2026-04-01' });
    expect(m.get('effectiveDate')).toBe(v.dateInvalid);
    expect(m.get('endDate')).toBeUndefined();
  });

  it('uses Lao messages on every equity and money branch', () => {
    expect(messages({ ...base, equity: { kind: 'bogus' } }).get('equity.kind')).toBe(v.invalid);
    expect(messages({ ...base, equity: 5 }).get('equity')).toBe(v.invalid);
    expect(messages({ ...base, equity: { kind: 'percent' } }).get('equity.percent')).toBe(v.percentRange);
    expect(messages({ ...base, equity: { kind: 'percent', percent: NaN } }).get('equity.percent')).toBe(v.percentRange);
    expect(messages({ ...base, equity: { kind: 'amount' } }).get('equity.money')).toBe(v.invalid);
    expect(messages({ ...base, equity: { kind: 'amount', money: { currency: 'USD' } } }).get('equity.money.amount')).toBe(v.amountPositive);
    expect(messages({ ...base, equity: { kind: 'amount', money: { amount: 1, currency: 'THB' } } }).get('equity.money.currency')).toBe(v.currency);
    expect(messages({ ...base, value: 'x' }).get('value')).toBe(v.invalid);
    expect(messages({ ...base, value: { amount: '5', currency: 'USD' } }).get('value.amount')).toBe(v.amountPositive);
    expect(messages({ ...base, value: { amount: 5 } }).get('value.currency')).toBe(v.currency);
  });

  it('never lets a zod English default message through', () => {
    const bad = {
      title: 5, type: 'nope', contractNo: null, counterparty: 1, termText: 1, signedDate: 3,
      effectiveDate: undefined, endDate: 4, value: 1, equity: 'x', implementer: 1, notes: 1,
    };
    const all = new Set<string>(Object.values(v));
    const r = gcFormSchema.safeParse(bad);
    expect(r.success).toBe(false);
    if (!r.success) for (const i of r.error.issues) expect(all.has(i.message), `${i.path.join('.')}: ${i.message}`).toBe(true);
  });
});

describe('payload mapping review fixes', () => {
  it('trims endDate; blank becomes null (open-ended)', () => {
    expect(toGcPayload({ ...base, endDate: '  ' }).endDate).toBeNull();
    expect(toGcPayload({ ...base, endDate: '' }).endDate).toBeNull();
    expect(toGcPayload({ ...base, endDate: ' 2030-01-01 ' }).endDate).toBe('2030-01-01');
  });

  it('round-trips a contract with value, percent equity and an open end', () => {
    const c: GeneralContract = {
      id: '9', createdAt: 'a', updatedAt: 'b', createdBy: 'u',
      title: 'T', type: 'shareholding', contractNo: 'GC-9', counterparty: 'X', termText: null,
      signedDate: '2026-01-01', effectiveDate: '2026-01-02', endDate: null,
      value: { amount: 1500.5, currency: 'USD' }, equity: { kind: 'percent', percent: 25 },
      implementer: null, notes: 'n',
    };
    const { id, createdAt, updatedAt, createdBy, ...fields } = c;
    void id; void createdAt; void updatedAt; void createdBy;
    expect(toGcPayload(fromGcContract(c))).toEqual(fields);
  });
});
