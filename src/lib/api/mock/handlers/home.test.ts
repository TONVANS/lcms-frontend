import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { buildHomeView } from '@/features/home/lib/build-home-view';
import type { HomeSummary } from '@/features/home/types';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { deriveGcStatus } from '@/features/gc/lib/derive-status';
import { gcMockDb } from '@/features/gc/mocks/gc.mock';
import { isCaseFinished } from '@/features/legal/cases/lib/case-money';
import { casesMockDb } from '@/features/legal/cases/mocks/cases.mock';
import { regulationsMockDb } from '@/features/legal/regulations/mocks/regulations.mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

const admin = MOCK_USERS.find((u) => u.username === 'admin')!;

beforeEach(() => {
  clearMockSession();
  gcMockDb.reset(new Date());
  regulationsMockDb.reset(new Date());
  casesMockDb.reset(new Date());
});

describe('home summary handler', () => {
  it('returns 401 without a session', async () => {
    await expect(api.get(endpoints.home.summary)).rejects.toMatchObject({
      status: 401,
    });
  });

  it('serves raw alerts (<= 90 days, overdue kept) so the view yields real buckets', async () => {
    setMockSession('admin', false);
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    expect(data).not.toHaveProperty('upcoming');
    expect(data.alerts.some((a) => a.daysLeft < 0)).toBe(true);
    expect(data.alerts.every((a) => a.daysLeft <= 90)).toBe(true);
    // Non-gc offsets: ppa -2,0,3,12,45 (no legal seeds). Generated gc alerts (60/30/7/0 windows,
    // overdue >30d dropped): expiring ends at 0,3,7,25,45,60; expired -1,-10,-25 (<0, not bucketed).
    // 0..7: ppa 0,3 + gc 0,3,7 = 5; 8..30: ppa 12 + gc 25 = 2;
    // 31..90: ppa 45 + gc 45,60 = 3.
    expect(buildHomeView(data, admin).alertBuckets).toEqual({
      within7: 5,
      within30: 2,
      within90: 3,
    });
  });

  it('reports gc active as active only (expiring is its own count), matching the gc dashboard', async () => {
    setMockSession('admin', false);
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    const gc = data.modules.find((m) => m.module === 'gc')!;
    const statuses = gcMockDb.all().map((c) => deriveGcStatus(c, new Date()));
    const count = (s: string) => statuses.filter((x) => x === s).length;
    expect(count('expiring')).toBeGreaterThan(0);
    expect(gc).toEqual({
      module: 'gc',
      total: statuses.length,
      active: count('active'),
      expiring: count('expiring'),
    });
  });

  it('reports legal stats from legal mock dbs, matching the legal modules', async () => {
    setMockSession('admin', false);
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    const legal = data.modules.find((m) => m.module === 'legal')!;
    const regs = regulationsMockDb.all();
    const cases = casesMockDb.all();
    const activeRegs = regs.filter((r) => r.status === 'in_force').length;
    const activeCases = cases.filter((c) => !isCaseFinished(c.stage)).length;
    const expectedActive = activeRegs + activeCases;
    const expectedTotal = regs.length + cases.length;

    expect(expectedTotal).toBe(54);
    expect(legal).toEqual({
      module: 'legal',
      total: expectedTotal,
      active: expectedActive,
      expiring: 0,
    });
  });

  it('filters by the session user modules', async () => {
    setMockSession('ppa.user', false);
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    expect(data.modules.map((m) => m.module)).toEqual(['ppa']);
    expect(data.alerts.every((a) => a.module === 'ppa')).toBe(true);
  });

  it('filters by legal.user session to only show legal card and empty alerts', async () => {
    setMockSession('legal.user', false);
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    expect(data.modules.map((m) => m.module)).toEqual(['legal']);
    expect(data.alerts.every((a) => a.module === 'legal')).toBe(true);
  });
});
