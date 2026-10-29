import { describe, expect, it } from 'vitest';
import { toHistoryEntry } from './history-mapper';

describe('toHistoryEntry', () => {
  it('maps a changes array with alternative label/old/new names', () => {
    expect(
      toHistoryEntry({
        id: 'h1',
        action: 'UPDATE_CONTRACT',
        createdAt: '2026-03-01T10:00:00.000Z',
        user: { fullName: 'Somchai' },
        changes: [
          { field: 'title', label: 'Title', oldValue: 'A', newValue: 'B' },
          { field: 'amount', fieldLabel: 'Amount', old: 1, new: 2 },
          { field: 'x', fieldLo: 'Xlo', from: null, to: true },
        ],
      }),
    ).toEqual({
      id: 'h1',
      action: 'UPDATE_CONTRACT',
      createdAt: '2026-03-01T10:00:00.000Z',
      userName: 'Somchai',
      changes: [
        { field: 'title', label: 'Title', oldValue: 'A', newValue: 'B' },
        { field: 'amount', label: 'Amount', oldValue: '1', newValue: '2' },
        { field: 'x', label: 'Xlo', oldValue: null, newValue: 'true' },
      ],
    });
  });

  it('maps an object map of { field: { old, new } }', () => {
    const e = toHistoryEntry({
      id: 'h2',
      action: 'CREATE_CONTRACT',
      createdAt: '2026-03-02',
      userName: 'Nok',
      changes: { status: { old: 'DRAFT', new: 'ACTIVE' }, note: { oldValue: undefined, newValue: 'hi' } },
    });
    expect(e.userName).toBe('Nok');
    expect(e.changes).toEqual([
      { field: 'status', label: 'status', oldValue: 'DRAFT', newValue: 'ACTIVE' },
      { field: 'note', label: 'note', oldValue: null, newValue: 'hi' },
    ]);
  });

  it('falls back to performedBy and stringifies objects', () => {
    const e = toHistoryEntry({
      id: 3,
      action: 'DELETE_CONTRACT',
      createdAt: '2026-03-03',
      performedBy: 'Ann',
      changes: [{ field: 'o', oldValue: { a: 1 }, newValue: '' }],
    });
    expect(e.id).toBe('3');
    expect(e.userName).toBe('Ann');
    expect(e.changes[0]).toMatchObject({ oldValue: '{"a":1}', newValue: null });
  });

  it('is null-safe', () => {
    expect(toHistoryEntry(null)).toEqual({ id: '', action: '', createdAt: '', userName: null, changes: [] });
    expect(toHistoryEntry({ id: 'x', changes: null, user: null }).changes).toEqual([]);
  });
});
