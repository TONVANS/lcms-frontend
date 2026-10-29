import type MockAdapter from 'axios-mock-adapter';
import { MOCK_ALERTS } from '@/features/alerts/mocks/alerts.mock';
import { gcMockDb } from '@/features/gc/mocks/gc.mock';
import { isCaseFinished } from '@/features/legal/cases/lib/case-money';
import { casesMockDb } from '@/features/legal/cases/mocks/cases.mock';
import { regulationsMockDb } from '@/features/legal/regulations/mocks/regulations.mock';
import type { HomeSummary } from '@/features/home/types';
import { MOCK_MODULE_STATS } from '@/features/home/mocks/home.mock';
import { getAccessibleModules } from '@/lib/auth/permissions';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

function gcStats(): HomeSummary['modules'][number] {
  const statuses = gcMockDb.all().map((c) => c.status);
  const count = (s: string) => statuses.filter((x) => x === s).length;
  return {
    module: 'gc',
    total: statuses.length,
    active: count('ACTIVE'),
    expiring: count('EXPIRING_SOON'),
  };
}

function legalStats(): HomeSummary['modules'][number] {
  const regs = regulationsMockDb.all();
  const cases = casesMockDb.all();
  const inForceRegs = regs.filter((r) => r.status === 'in_force').length;
  const inProgressCases = cases.filter((c) => !isCaseFinished(c.stage)).length;
  return {
    module: 'legal',
    total: regs.length + cases.length,
    active: inForceRegs + inProgressCases,
    expiring: 0,
  };
}

export function register(mock: MockAdapter): void {
  mock.onGet(endpoints.home.summary).reply(() => {
    const user = getMockSessionUser();
    if (!user) return [401, { code: 'UNAUTHENTICATED' }];
    const allowed = getAccessibleModules(user);
    const summary: HomeSummary = {
      modules: MOCK_MODULE_STATS.map((m) => {
        if (m.module === 'gc') return gcStats();
        if (m.module === 'legal') return legalStats();
        return m;
      }).filter((m) => allowed.includes(m.module)),
      alerts: MOCK_ALERTS
        .filter((a) => allowed.includes(a.module) && a.daysLeft <= 90)
        .map((a) => ({ ...a })),
    };
    return [200, summary];
  });
}
