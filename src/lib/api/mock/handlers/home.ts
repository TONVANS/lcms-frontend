import type MockAdapter from 'axios-mock-adapter';
import { MOCK_ALERTS } from '@/features/alerts/mocks/alerts.mock';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { filterSummaryForUser } from '@/features/home/lib/filter-summary';
import { MOCK_MODULE_STATS } from '@/features/home/mocks/home.mock';
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
    const raw = {
      modules: MOCK_MODULE_STATS,
      upcoming: MOCK_ALERTS,
      alertBuckets: { within7: 0, within30: 0, within90: 0 },
    };
    return [200, filterSummaryForUser(raw, user)];
  });
}
