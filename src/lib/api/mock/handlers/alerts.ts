import type MockAdapter from 'axios-mock-adapter';
import { MOCK_ALERTS } from '@/features/alerts/mocks/alerts.mock';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { getAccessibleModules } from '@/lib/auth/permissions';
import { readMockSession } from '@/lib/auth/session';
import type { Alert, ModuleKey } from '@/types/domain';
import { endpoints } from '../../endpoints';

function sessionUser() {
  const username = readMockSession();
  return username ? (MOCK_USERS.find((u) => u.username === username) ?? null) : null;
}

// Per-session in-memory copy so PATCH /read persists until reload.
const alerts: Alert[] = MOCK_ALERTS.map((a) => ({ ...a }));

export function register(mock: MockAdapter): void {
  mock.onGet(endpoints.alerts.list).reply((config) => {
    const user = sessionUser();
    if (!user) return [401, { code: 'UNAUTHENTICATED' }];
    const params = (config.params ?? {}) as { module?: ModuleKey; window?: number | string };
    const allowed = getAccessibleModules(user);
    const win = params.window === undefined ? undefined : Number(params.window);
    const result = alerts.filter(
      (a) =>
        allowed.includes(a.module) &&
        (!params.module || a.module === params.module) &&
        (win === undefined || (a.daysLeft >= 0 && a.daysLeft <= win)),
    );
    return [200, result.map((a) => ({ ...a }))];
  });

  mock.onPatch(/\/alerts\/[^/]+\/read$/).reply((config) => {
    const user = sessionUser();
    if (!user) return [401, { code: 'UNAUTHENTICATED' }];
    const id = config.url?.match(/\/alerts\/([^/]+)\/read$/)?.[1];
    const alert = alerts.find((a) => a.id === id);
    if (!alert || !getAccessibleModules(user).includes(alert.module)) {
      return [404, { code: 'NOT_FOUND' }];
    }
    alert.read = true;
    return [204];
  });
}
