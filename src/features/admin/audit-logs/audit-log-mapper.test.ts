import { describe, expect, it } from 'vitest';
import { toAuditLog } from './audit-log-mapper';

describe('toAuditLog', () => {
  it('maps a full record and diffs oldValues/newValues', () => {
    const a = toAuditLog({
      id: 7,
      action: 'UPDATE_CONTRACT',
      createdAt: '2026-10-01T08:30:00.000Z',
      userId: 'u-1',
      user: { fullName: 'Somphone' },
      entityType: 'Contract',
      entityId: 'c-9',
      contract: { contractNumber: 'GC-001' },
      ipAddress: '10.0.0.5',
      oldValues: { title: 'A', amount: 100, same: 1 },
      newValues: { title: 'B', amount: 200, same: 1, note: 'x' },
    });
    expect(a).toMatchObject({
      id: '7',
      action: 'UPDATE_CONTRACT',
      userId: 'u-1',
      userName: 'Somphone',
      targetType: 'Contract',
      targetId: 'c-9',
      targetLabel: 'GC-001',
      ipAddress: '10.0.0.5',
    });
    expect(a.changes).toEqual([
      { field: 'title', label: 'title', oldValue: 'A', newValue: 'B' },
      { field: 'amount', label: 'amount', oldValue: '100', newValue: '200' },
      { field: 'note', label: 'note', oldValue: null, newValue: 'x' },
    ]);
  });

  it('parses JSON strings and tolerates missing values', () => {
    const a = toAuditLog({ id: 'x', action: 'CREATE_CONTRACT', newValues: '{"title":"T"}' });
    expect(a.changes).toEqual([{ field: 'title', label: 'title', oldValue: null, newValue: 'T' }]);
    expect(a.userName).toBeNull();
    expect(a.ipAddress).toBeNull();
  });

  it('never throws on garbage', () => {
    expect(toAuditLog(null)).toMatchObject({ id: '', action: '', changes: [] });
    expect(toAuditLog({ oldValues: 5, newValues: 'not json' }).changes).toEqual([]);
  });

  it('falls back to a pre-built changes field', () => {
    const a = toAuditLog({ id: '1', changes: [{ field: 'f', oldValue: 1, newValue: 2 }] });
    expect(a.changes).toEqual([{ field: 'f', label: 'f', oldValue: '1', newValue: '2' }]);
  });
});
