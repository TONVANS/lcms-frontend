import type { HomeSummary } from '../types';

export const MOCK_MODULE_STATS: HomeSummary['modules'] = [
  { module: 'ppa', total: 42, active: 35, expiring: 4 },
  { module: 'gc', total: 1240, active: 1086, expiring: 37 },
  { module: 'legal', total: 318, active: 261, expiring: 12 },
];
