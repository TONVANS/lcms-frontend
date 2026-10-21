import type { HomeSummary } from '../types';

export const MOCK_MODULE_STATS: HomeSummary['modules'] = [
  { module: 'ppa', total: 42, active: 35, expiring: 4 },
  // Position placeholder only: replaced per request by gcStats() in handlers/home.ts.
  { module: 'gc', total: 0, active: 0, expiring: 0 },
  { module: 'legal', total: 318, active: 261, expiring: 12 },
];
