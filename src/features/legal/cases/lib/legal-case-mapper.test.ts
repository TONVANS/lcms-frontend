import { describe, expect, it } from 'vitest';
import { emptyLegalCaseForm } from '../schemas/legal-case.schema';
import {
  caseTotalDue,
  diffLegalCasePayload,
  toLegalCase,
  toLegalCasePayload,
  toLegalCasesDashboard,
} from './legal-case-mapper';

describe('toLegalCase', () => {
  it('prefers internalId, parses Decimal strings and ISO datetimes', () => {
    const c = toLegalCase({
      id: 42,
      internalId: 'uuid-1',
      caseCode: 'EDL-2026-005',
      defendant: 'ABC',
      allegation: 'x',
      caseType: 'COMMERCIAL',
      damageLak: '500000000.00',
      damageUsd: 25000,
      fineLak: '50,000,000',
      fineUsd: null,
      totalDueLak: '550000000',
      disputeStatus: 'APPEAL',
      date: '2026-01-15T00:00:00.000Z',
      department: { id: 'd1', name: 'Legal' },
    });
    expect(c).toMatchObject({
      id: 'uuid-1',
      damageLak: 500000000,
      damageUsd: 25000,
      fineLak: 50000000,
      fineUsd: null,
      totalDueLak: 550000000,
      totalDueUsd: null,
      disputeStatus: 'APPEAL',
      date: '2026-01-15',
      departmentId: 'd1',
      department: { id: 'd1', name: 'Legal', code: null },
    });
  });

  it('falls back to id and tolerates junk', () => {
    const c = toLegalCase({ id: 9, caseType: 'zzz', disputeStatus: 'nope' });
    expect(c.id).toBe('9');
    expect(c.caseType).toBe('OTHER');
    expect(c.disputeStatus).toBe('FIRST_INSTANCE');
    expect(toLegalCase(undefined).caseCode).toBe('');
  });
});

describe('caseTotalDue', () => {
  const base = toLegalCase({ id: 'a', damageLak: 10, fineLak: 5 });
  it('uses damage + fine when the server gave none', () => {
    expect(caseTotalDue(base, 'lak')).toBe(15);
    expect(caseTotalDue(base, 'usd')).toBeNull();
  });
  it('prefers the server value', () => {
    expect(caseTotalDue({ ...base, totalDueLak: 99 }, 'lak')).toBe(99);
  });
});

describe('payload and diff', () => {
  const form = { ...emptyLegalCaseForm(), caseCode: ' C1 ', defendant: ' D ', date: '2026-02-03' };

  it('builds the DTO without totalDue and with zero default amounts', () => {
    const p = toLegalCasePayload({ ...form, damageLak: 5, departmentId: 'dep', allegation: 'al' });
    expect(p).toEqual({
      caseCode: 'C1',
      defendant: 'D',
      caseType: 'CIVIL',
      disputeStatus: 'FIRST_INSTANCE',
      date: '2026-02-03',
      damageLak: 5,
      damageUsd: 0,
      fineLak: 0,
      fineUsd: 0,
      recoveredLak: 0,
      recoveredUsd: 0,
      allegation: 'al',
      departmentId: 'dep',
    });
    expect(Object.keys(p).some((k) => k.startsWith('totalDue'))).toBe(false);
  });

  it('diff sends changed keys only and null for cleared optionals', () => {
    const before = toLegalCasePayload({ ...form, allegation: 'old', damageLak: 1 });
    const after = toLegalCasePayload({ ...form, allegation: '', damageLak: 2 });
    expect(diffLegalCasePayload(after, before)).toEqual({ allegation: null, damageLak: 2 });
    expect(diffLegalCasePayload(before, before)).toEqual({});
  });
});

describe('toLegalCasesDashboard', () => {
  it('reads nested lak/usd totals and object-map statuses', () => {
    const d = toLegalCasesDashboard({
      data: {
        total: 7,
        byDisputeStatus: { FIRST_INSTANCE: 3, CLOSED: '4' },
        lak: { damage: '100', fine: 20, totalDue: '120', recovered: 5 },
        usd: { damage: 1, fine: 2, recovered: 0 },
      },
    });
    expect(d.total).toBe(7);
    expect(d.byDisputeStatus.map((s) => s.count)).toEqual([3, 0, 0, 4, 0]);
    expect(d.lak).toEqual({ damage: 100, fine: 20, totalDue: 120, recovered: 5 });
    expect(d.usd).toEqual({ damage: 1, fine: 2, totalDue: 3, recovered: 0 });
  });

  it('reads flat fields and groupBy rows', () => {
    const d = toLegalCasesDashboard({
      byStatus: [
        { disputeStatus: 'APPEAL', _count: 2 },
        { disputeStatus: 'RESOLVED', _count: 1 },
      ],
      totalDamageLak: 10,
      totalFineLak: 5,
      totalDueLak: 15,
      totalRecoveredLak: 3,
      totalDamageUsd: '4',
    });
    expect(d.total).toBe(3);
    expect(d.lak).toEqual({ damage: 10, fine: 5, totalDue: 15, recovered: 3 });
    expect(d.usd.damage).toBe(4);
  });

  it('survives garbage', () => {
    const d = toLegalCasesDashboard(null);
    expect(d.total).toBe(0);
    expect(d.lak).toEqual({ damage: 0, fine: 0, totalDue: 0, recovered: 0 });
  });
});
