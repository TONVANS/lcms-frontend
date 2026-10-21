import { addDays, format, parseISO } from 'date-fns';
import { lo } from '@/lib/i18n/lo';
import { daysLeft } from '@/lib/utils/date';
import type { GeneralContract } from '../types';
import { GC_ALERT_DAYS } from './alerts';

export type GcKeyDateStatus = 'done' | 'current' | 'future';

export interface GcKeyDate {
  key: string;
  label: string;
  /** Local YYYY-MM-DD. */
  date: string;
  status: GcKeyDateStatus;
}

/**
 * Chronological key dates of a contract: signed, effective, the alert points (endDate minus
 * 60/30/7 days), then the end. Alert points dated before the effective date, or on a date
 * already listed, are dropped. `current` is every item on the first date on or after today; if every date
 * is past nothing is current. Open-ended contracts list only signed and effective.
 */
export function buildGcKeyDates(
  c: Pick<GeneralContract, 'signedDate' | 'effectiveDate' | 'endDate'>,
  today: Date = new Date(),
): GcKeyDate[] {
  const raw: { key: string; label: string; date: string; alert: boolean }[] = [
    { key: 'signed', label: lo.gc.fields.signedDate, date: c.signedDate, alert: false },
    { key: 'effective', label: lo.gc.fields.effectiveDate, date: c.effectiveDate, alert: false },
  ];
  if (c.endDate) {
    const end = parseISO(c.endDate);
    for (const n of GC_ALERT_DAYS) {
      if (n === 0) continue; // the end itself is added below
      raw.push({
        key: `alert-${n}`,
        label: lo.gc.detail.alertAt(n),
        date: format(addDays(end, -n), 'yyyy-MM-dd'),
        alert: true,
      });
    }
    raw.push({ key: 'end', label: lo.gc.fields.endDate, date: c.endDate, alert: false });
  }

  // ISO dates sort lexically; Array.sort is stable so equal dates keep insertion order.
  const sorted = [...raw].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const seen = new Set<string>();
  const kept = sorted.filter((item) => {
    if (item.alert && (item.date < c.effectiveDate || seen.has(item.date))) return false;
    seen.add(item.date);
    return true;
  });

  const nextDate = kept.find((item) => (daysLeft(item.date, today) ?? -1) >= 0)?.date;
  return kept.map(({ key, label, date }) => {
    const status: GcKeyDateStatus =
      nextDate === undefined || date < nextDate ? 'done' : date === nextDate ? 'current' : 'future';
    return { key, label, date, status };
  });
}
