import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { GC_CONTRACT_TYPES, GC_STATUSES } from '../types';
import { deriveGcStatus, GC_STATUS_TONE } from './derive-status';

const today = new Date(2026, 9, 20);

describe('deriveGcStatus', () => {
  it('derives the four statuses at the boundaries', () => {
    expect(deriveGcStatus({ effectiveDate: '2026-11-01', endDate: '2027-11-01' }, today)).toBe('pending');
    expect(deriveGcStatus({ effectiveDate: '2025-01-01', endDate: '2026-12-20' }, today)).toBe('active');
    expect(deriveGcStatus({ effectiveDate: '2025-01-01', endDate: '2026-12-19' }, today)).toBe('expiring');
    expect(deriveGcStatus({ effectiveDate: '2025-01-01', endDate: '2026-10-20' }, today)).toBe('expiring');
    expect(deriveGcStatus({ effectiveDate: '2025-01-01', endDate: '2026-10-19' }, today)).toBe('expired');
    expect(deriveGcStatus({ effectiveDate: '2025-01-01', endDate: null }, today)).toBe('active');
  });

  it('maps every status to a tone', () => {
    expect(GC_STATUS_TONE).toEqual({ pending: 'blue', active: 'emerald', expiring: 'amber', expired: 'rose' });
    expect(Object.keys(GC_STATUS_TONE)).toEqual([...GC_STATUSES]);
  });

  it('keeps lao type labels aligned with the type keys', () => {
    expect(Object.keys(lo.gc.types)).toEqual([...GC_CONTRACT_TYPES]);
    expect(Object.keys(lo.gc.status)).toEqual([...GC_STATUSES]);
  });
});
