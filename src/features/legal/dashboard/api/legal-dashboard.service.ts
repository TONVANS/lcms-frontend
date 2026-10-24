import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { LegalDashboard } from '../types';

export const legalDashboardService = {
  get: (): Promise<LegalDashboard> =>
    api.get<LegalDashboard>(endpoints.legal.dashboard).then((r) => r.data),
};
