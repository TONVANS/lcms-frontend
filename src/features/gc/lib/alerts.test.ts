import { describe, expect, it } from 'vitest';
import type { GeneralContract } from '../types';
import { buildGcAlerts } from './alerts';

const today = new Date(2026, 9, 20);

const mk = (over: Partial<GeneralContract>): GeneralContract => ({
  id: 'x',
  title: 'Test contract',
  type: 'om_service',
  contractNo: 'GC-001',
  counterparty: null,
  termText: null,
  signedDate: '2025-01-01',
  effectiveDate: '2025-01-01',
  endDate: null,
  value: null,
  equity: null,
  implementer: null,
  notes: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  createdBy: 'u1',
  ...over,
});

const a = (end: string | null) => buildGcAlerts([mk({ id: 'x', endDate: end })], today);

describe('buildGcAlerts', () => {
  it('emits one alert for the latest crossed window', () => {
    expect(a('2026-12-19').map((x) => x.id)).toEqual(['gc-x-w60']);
    expect(a('2026-11-19').map((x) => x.id)).toEqual(['gc-x-w30']);
    expect(a('2026-10-27').map((x) => x.id)).toEqual(['gc-x-w7']);
    expect(a('2026-10-20').map((x) => x.id)).toEqual(['gc-x-w0']);
    expect(a('2026-10-10').map((x) => x.id)).toEqual(['gc-x-w0']);
  });

  it('emits nothing outside the range or when open-ended', () => {
    expect(a('2026-09-19')).toEqual([]);
    expect(a('2026-12-20')).toEqual([]);
    expect(a(null)).toEqual([]);
  });

  it('fills the alert fields', () => {
    expect(a('2026-10-27')[0]).toEqual({
      id: 'gc-x-w7',
      module: 'gc',
      entityType: 'gc-contract',
      entityId: 'x',
      title: 'Test contract',
      dueDate: '2026-10-27',
      daysLeft: 7,
      read: false,
    });
  });
});
