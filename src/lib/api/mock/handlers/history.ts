import type MockAdapter from 'axios-mock-adapter';
import { MOCK_HISTORY } from '@/features/history/mocks/history.mock';
import type { HistoryKind } from '@/features/history/types';
import { hasPermission } from '@/lib/auth/permissions';
import type { ModuleKey } from '@/types/domain';
import { getMockSessionUser } from '../session';

const MODULE_KEY: Record<HistoryKind, ModuleKey> = { contracts: 'gc', 'power-contracts': 'ppa' };

const CONTRACT_HISTORY_RE = /^\/contracts\/[^/?]+\/history(\?.*)?$/;
const POWER_HISTORY_RE = /^\/power-contracts\/[^/?]+\/history(\?.*)?$/;

function serve(kind: HistoryKind) {
  return (config: { params?: Record<string, unknown> }): [number, unknown] => {
    const user = getMockSessionUser();
    if (!user) return [401, { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }];
    if (!hasPermission(user, MODULE_KEY[kind], 'view')) {
      return [403, { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' }];
    }
    const page = Math.max(1, Number(config.params?.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(config.params?.limit ?? 10) || 10));
    const action = typeof config.params?.action === 'string' ? config.params.action : undefined;
    const rows = MOCK_HISTORY[kind].filter((r) => !action || r.action === action);
    const total = rows.length;
    return [
      200,
      {
        data: rows.slice((page - 1) * limit, page * limit),
        meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    ];
  };
}

export function register(mock: MockAdapter): void {
  mock.onGet(CONTRACT_HISTORY_RE).reply(serve('contracts'));
  mock.onGet(POWER_HISTORY_RE).reply(serve('power-contracts'));
}
