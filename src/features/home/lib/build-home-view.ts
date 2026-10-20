import { getAccessibleModules } from '@/lib/auth/permissions';
import { daysLeft } from '@/lib/utils/date';
import type { User } from '@/types/domain';
import type { HomeSummary, HomeViewModel } from '../types';

/** Derives the Home view: module filter (defence in depth), upcoming 0..30 list and alert buckets. */
export function buildHomeView(s: HomeSummary, u: User, today: Date = new Date()): HomeViewModel {
  const allowed = new Set(getAccessibleModules(u));
  const modules = s.modules.filter((m) => allowed.has(m.module));
  const withDays = s.alerts
    .filter((a) => allowed.has(a.module))
    .map((a) => ({ a, d: daysLeft(a.dueDate, today) }));

  const upcoming = withDays
    .filter(({ d }) => d >= 0 && d <= 30)
    .sort((x, y) => (x.a.dueDate < y.a.dueDate ? -1 : x.a.dueDate > y.a.dueDate ? 1 : 0))
    .map(({ a }) => a);

  const alertBuckets = { within7: 0, within30: 0, within90: 0 };
  for (const { d } of withDays) {
    if (d >= 0 && d <= 7) alertBuckets.within7++;
    else if (d >= 8 && d <= 30) alertBuckets.within30++;
    else if (d >= 31 && d <= 90) alertBuckets.within90++;
  }
  return { modules, upcoming, alertBuckets };
}
