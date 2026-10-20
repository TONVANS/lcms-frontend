import type { Alert, ModuleKey } from '@/types/domain';

export interface ModuleStats {
  total: number;
  active: number;
  expiring: number;
}

/** Server contract: the user's alerts due within 90 days (overdue included), unsorted. */
export interface HomeSummary {
  modules: Array<{ module: ModuleKey } & ModuleStats>;
  alerts: Alert[];
}

/** Client view derived from a HomeSummary by buildHomeView. */
export interface HomeViewModel {
  modules: HomeSummary['modules'];
  upcoming: Alert[];
  alertBuckets: { within7: number; within30: number; within90: number };
}
