import type { Alert } from '@/types/domain';
import { daysLeft } from '@/lib/utils/date';
import type { GeneralContract } from '../types';

export const GC_ALERT_DAYS = [60, 30, 7, 0] as const;

const OVERDUE_CUTOFF = -30;

export function buildGcAlerts(contracts: GeneralContract[], today: Date = new Date()): Alert[] {
  const alerts: Alert[] = [];
  for (const c of contracts) {
    if (!c.endDate) continue;
    const left = daysLeft(c.endDate, today);
    if (left === null || left < OVERDUE_CUTOFF || left > GC_ALERT_DAYS[0]) continue;
    const window = Math.min(...GC_ALERT_DAYS.filter((w) => w >= left));
    alerts.push({
      id: `gc-${c.id}-w${window}`,
      module: 'gc',
      entityType: 'gc-contract',
      entityId: c.id,
      title: c.title,
      dueDate: c.endDate,
      daysLeft: left,
      read: false,
    });
  }
  return alerts;
}
