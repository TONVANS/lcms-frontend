import { daysLeft } from '@/lib/utils/date';
import type { Alert } from '@/types/domain';

export type GcAlertGroupKey = 'overdue' | 'd7' | 'd30' | 'd60';
export interface GcAlertGroup {
  key: GcAlertGroupKey;
  alerts: Alert[];
}

const ORDER: GcAlertGroupKey[] = ['overdue', 'd7', 'd30', 'd60'];

function keyFor(days: number): GcAlertGroupKey | null {
  if (days <= 0) return 'overdue';
  if (days <= 7) return 'd7';
  if (days <= 30) return 'd30';
  if (days <= 60) return 'd60';
  return null;
}

/** Groups by calendar days left (same local-day semantics as the server); empty groups are omitted. */
export function groupGcAlerts(alerts: Alert[], today: Date = new Date()): GcAlertGroup[] {
  const buckets: Record<GcAlertGroupKey, Alert[]> = { overdue: [], d7: [], d30: [], d60: [] };
  for (const a of alerts) {
    const days = daysLeft(a.dueDate, today);
    if (days === null) continue;
    const key = keyFor(days);
    if (key) buckets[key].push(a);
  }
  return ORDER.filter((k) => buckets[k].length > 0).map((key) => ({
    key,
    alerts: [...buckets[key]].sort((x, y) => x.dueDate.localeCompare(y.dueDate)),
  }));
}
