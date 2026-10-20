import type MockAdapter from 'axios-mock-adapter';
import { MOCK_ALERTS } from '@/features/alerts/mocks/alerts.mock';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import type { HomeSummary } from '@/features/home/types';
import { MOCK_MODULE_STATS } from '@/features/home/mocks/home.mock';
import { getAccessibleModules } from '@/lib/auth/permissions';
import { readMockSession } from '@/lib/auth/session';
import { endpoints } from '../../endpoints';

function sessionUser() {
  const username = readMockSession();
  return username ? (MOCK_USERS.find((u) => u.username === username) ?? null) : null;
}

export function register(mock: MockAdapter): void {
  mock.onGet(endpoints.home.summary).reply(() => {
    const user = sessionUser();
    if (!user) return [401, { code: 'UNAUTHENTICATED' }];
    const allowed = getAccessibleModules(user);
    const summary: HomeSummary = {
      modules: MOCK_MODULE_STATS.filter((m) => allowed.includes(m.module)),
      alerts: MOCK_ALERTS.filter((a) => allowed.includes(a.module) && a.daysLeft <= 90).map(
        (a) => ({ ...a }),
      ),
    };
    return [200, summary];
  });
}
