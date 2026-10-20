import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Alert, ModuleKey } from '@/types/domain';

export interface AlertsQuery {
  module?: ModuleKey;
  window?: 7 | 30 | 90;
}

export const alertsService = {
  async list(q?: AlertsQuery): Promise<Alert[]> {
    const { data } = await api.get<Alert[]>(endpoints.alerts.list, { params: q });
    return data;
  },
  async markRead(id: string): Promise<void> {
    await api.patch(endpoints.alerts.read(id));
  },
};
