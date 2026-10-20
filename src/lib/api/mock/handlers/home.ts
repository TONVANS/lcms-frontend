import type MockAdapter from 'axios-mock-adapter';
import { MOCK_ALERTS } from '@/features/alerts/mocks/alerts.mock';
import { deriveGcStatus } from '@/features/gc/lib/derive-status';
import { buildGcAlerts } from '@/features/gc/lib/alerts';
import { gcMockDb } from '@/features/gc/mocks/gc.mock';
import type { HomeSummary } from '@/features/home/types';
import { MOCK_MODULE_STATS } from '@/features/home/mocks/home.mock';
import { getAccessibleModules } from '@/lib/auth/permissions';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

function gcStats(): HomeSummary['modules'][number] {
  const today = new Date();
  const statuses = gcMockDb.all().map((c) => deriveGcStatus(c, today));
  const count = (s: string) => statuses.filter((x) => x === s).length;
  return {
    module: 'gc',
    total: statuses.length,
    active: count('active') + count('expiring'),
    expiring: count('expiring'),
  };
}

export function register(mock: MockAdapter): void {
  mock.onGet(endpoints.home.summary).reply(() => {
    const user = getMockSessionUser();
    if (!user) return [401, { code: 'UNAUTHENTICATED' }];
    const allowed = getAccessibleModules(user);
    const summary: HomeSummary = {
      modules: MOCK_MODULE_STATS.map((m) => (m.module === 'gc' ? gcStats() : m)).filter((m) =>
        allowed.includes(m.module),
      ),
      alerts: [...MOCK_ALERTS, ...buildGcAlerts(gcMockDb.all())]
        .filter((a) => allowed.includes(a.module) && a.daysLeft <= 90)
        .map((a) => ({ ...a })),
    };
    return [200, summary];
  });
}
