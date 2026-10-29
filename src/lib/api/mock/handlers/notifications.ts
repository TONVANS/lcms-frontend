import type MockAdapter from 'axios-mock-adapter';
import {
  createContractNotificationSeed,
  createPowerNotificationSeed,
} from '@/features/notifications/mocks/notifications.mock';
import { hasSystemModule } from '@/lib/auth/permissions';
import type { SystemModule, User } from '@/types/domain';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

type Rec = Record<string, unknown>;
type Source = 'contracts' | 'power';

// In-memory (until reload).
const db: Record<Source, Rec[]> = {
  contracts: createContractNotificationSeed(),
  power: createPowerNotificationSeed(),
};

const BASE: Record<Source, string> = {
  contracts: endpoints.notifications.list,
  power: endpoints.powerNotifications.list,
};

function allowed(user: User, source: Source): boolean {
  const modules: SystemModule[] = source === 'contracts' ? ['contracts'] : ['power-contracts', 'power-notifications'];
  return modules.some((m) => hasSystemModule(user, m));
}

function guard(source: Source): [number, unknown] | User {
  const user = getMockSessionUser();
  if (!user) return [401, { code: 'UNAUTHENTICATED' }];
  if (!allowed(user, source)) {
    return [403, { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' }];
  }
  return user;
}

const isReply = (v: [number, unknown] | User): v is [number, unknown] => Array.isArray(v);

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function register(mock: MockAdapter): void {
  for (const source of ['contracts', 'power'] as const) {
    const base = BASE[source];

    mock.onGet(base).reply((config) => {
      const g = guard(source);
      if (isReply(g)) return g;
      const raw = (config.params as { unreadOnly?: unknown } | undefined)?.unreadOnly;
      const unreadOnly = raw === true || raw === 'true';
      const data = db[source].filter((n) => !unreadOnly || n.isRead !== true);
      return [200, { data }];
    });

    mock.onPatch(`${base}/read-all`).reply(() => {
      const g = guard(source);
      if (isReply(g)) return g;
      db[source].forEach((n) => {
        n.isRead = true;
      });
      return [200, { data: { success: true } }];
    });

    mock.onPatch(new RegExp(`^${escape(base)}/[^/]+/read$`)).reply((config) => {
      const g = guard(source);
      if (isReply(g)) return g;
      const id = decodeURIComponent(config.url?.match(/\/([^/]+)\/read$/)?.[1] ?? '');
      const found = db[source].find((n) => n.id === id);
      if (!found) return [404, { statusCode: 404, message: 'Not Found' }];
      found.isRead = true;
      return [200, { data: found }];
    });
  }
}
