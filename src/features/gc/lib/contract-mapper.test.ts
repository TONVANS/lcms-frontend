import { describe, expect, it } from 'vitest';
import { diffPayload, toContract, toContractPayload } from './contract-mapper';

describe('toContract', () => {
  it('coerces string numbers, ISO datetimes and nested contractType', () => {
    const c = toContract({
      id: 7,
      title: ' T ',
      contractTypeId: '3',
      contractType: { id: 3, nameLo: 'ເຊົ່າ', nameEn: 'Land' },
      contractNumber: 'N-1',
      durationMonths: '60',
      signedDate: '2026-01-10T00:00:00.000Z',
      contractValue: '1500000.50',
      currency: 'USD',
      sharePercentage: '51.5',
      notifyDaysBefore: '60',
      status: 'EXPIRING_SOON',
    });
    expect(c.id).toBe('7');
    expect(c.title).toBe('T');
    expect(c.contractTypeId).toBe(3);
    expect(c.contractType).toEqual({ id: 3, nameLo: 'ເຊົ່າ', nameEn: 'Land' });
    expect(c.durationMonths).toBe(60);
    expect(c.signedDate).toBe('2026-01-10');
    expect(c.contractValue).toBe(1500000.5);
    expect(c.sharePercentage).toBe(51.5);
    expect(c.status).toBe('EXPIRING_SOON');
  });

  it('falls back to contractTypeName and nulls missing fields', () => {
    const c = toContract({ id: 'a', contractTypeId: 2, contractTypeName: 'O&M', currency: 'EUR' });
    expect(c.contractType).toEqual({ id: 2, nameLo: 'O&M', nameEn: null });
    expect(c.currency).toBeNull();
    expect(c.expirationDate).toBeNull();
    expect(c.contractValue).toBeNull();
    expect(c.status).toBe('DRAFT');
  });

  it('survives garbage', () => {
    expect(toContract(null).id).toBe('');
  });
});

describe('toContractPayload', () => {
  const form = {
    title: ' T ',
    contractTypeId: 1,
    contractNumber: 'N',
    durationText: '',
    durationMonths: 12,
    signedDate: '2026-01-10',
    effectiveDate: '',
    expirationDate: '2027-01-10',
    contractValue: 100,
    currency: 'LAK' as const,
    equityOrCapitalContribution: '',
    sharePercentage: null,
    implementer: '',
    additionalDetails: '',
    notifyDaysBefore: 60,
  };
  it('drops empty values and keeps numbers numeric', () => {
    expect(toContractPayload(form)).toEqual({
      title: 'T',
      contractTypeId: 1,
      contractNumber: 'N',
      durationMonths: 12,
      signedDate: '2026-01-10',
      expirationDate: '2027-01-10',
      contractValue: 100,
      currency: 'LAK',
      notifyDaysBefore: 60,
    });
  });
});

describe('diffPayload', () => {
  it('returns only changed fields', () => {
    const original = toContract({ id: '1', title: 'A', contractTypeId: 1, contractNumber: 'N', notifyDaysBefore: 60 });
    const next = { title: 'B', contractTypeId: 1, contractNumber: 'N', notifyDaysBefore: 60, implementer: 'X' };
    expect(diffPayload(original, next)).toEqual({ title: 'B', implementer: 'X' });
  });
  it('empty when nothing changed', () => {
    const original = toContract({ id: '1', title: 'A', contractTypeId: 1, contractNumber: 'N' });
    expect(diffPayload(original, { title: 'A', contractTypeId: 1, contractNumber: 'N' })).toEqual({});
  });
});
