import type { StatusTone } from '@/lib/constants/status';
import { daysLeft } from '@/lib/utils/date';
import type { GcStatus, GeneralContract } from '../types';

export const GC_EXPIRING_DAYS = 60;

export const GC_STATUS_TONE: Record<GcStatus, StatusTone> = {
  pending: 'blue',
  active: 'emerald',
  expiring: 'amber',
  expired: 'rose',
};

export function deriveGcStatus(
  c: Pick<GeneralContract, 'effectiveDate' | 'endDate'>,
  today: Date = new Date(),
): GcStatus {
  const untilEffective = daysLeft(c.effectiveDate, today);
  if (untilEffective !== null && untilEffective > 0) return 'pending';
  const left = daysLeft(c.endDate, today);
  if (left === null) return 'active';
  if (left < 0) return 'expired';
  if (left <= GC_EXPIRING_DAYS) return 'expiring';
  return 'active';
}
