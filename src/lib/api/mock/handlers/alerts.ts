import type MockAdapter from 'axios-mock-adapter';
import { MOCK_ALERTS } from '@/features/alerts/mocks/alerts.mock';
import { getAccessibleModules } from '@/lib/auth/permissions';
import type { Alert, ModuleKey } from '@/types/domain';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

// Read state lives in memory (until reload), keyed by alert id, so it applies to
// the static alerts (GC alerts now come from /notifications).
const readIds = new Set<string>(MOCK_ALERTS.filter((a) => a.read).map((a) => a.id));

function allAlerts(): Alert[] {
  return MOCK_ALERTS.map((a) => ({
    ...a,
    read: readIds.has(a.id),
  }));
}

export function register(mock: MockAdapter): void {
  mock.onGet(endpoints.alerts.list).reply((config) => {
    const user = getMockSessionUser();
    if (!user) return [401, { code: 'UNAUTHENTICATED' }];
    const params = (config.params ?? {}) as { module?: ModuleKey; window?: number | string };
    const allowed = getAccessibleModules(user);
    const win = params.window === undefined ? undefined : Number(params.window);
    const result = allAlerts().filter(
      (a) =>
        allowed.includes(a.module) &&
        (!params.module || a.module === params.module) &&
        (win === undefined || (a.daysLeft >= 0 && a.daysLeft <= win)),
    );
    return [200, result];
  });

  mock.onPatch(/\/alerts\/[^/]+\/read$/).reply((config) => {
    const user = getMockSessionUser();
    if (!user) return [401, { code: 'UNAUTHENTICATED' }];
    const id = config.url?.match(/\/alerts\/([^/]+)\/read$/)?.[1];
    const alert = allAlerts().find((a) => a.id === id);
    if (!alert || !getAccessibleModules(user).includes(alert.module)) {
      return [404, { code: 'NOT_FOUND' }];
    }
    readIds.add(alert.id);
    return [204];
  });
}
