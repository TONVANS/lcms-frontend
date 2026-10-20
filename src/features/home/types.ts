import type { Alert, ModuleKey } from '@/types/domain';

export interface ModuleStats {
  total: number;
  active: number;
  expiring: number;
}

export interface HomeSummary {
  modules: Array<{ module: ModuleKey } & ModuleStats>;
  upcoming: Alert[];
  alertBuckets: { within7: number; within30: number; within90: number };
}
