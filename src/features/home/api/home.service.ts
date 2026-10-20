import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { HomeSummary } from '../types';

export const homeService = {
  async summary(): Promise<HomeSummary> {
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    return data;
  },
};
