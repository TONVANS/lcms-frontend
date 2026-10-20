import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { buildHomeView } from '@/features/home/lib/build-home-view';
import type { HomeSummary } from '@/features/home/types';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { gcMockDb } from '@/features/gc/mocks/gc.mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

const admin = MOCK_USERS.find((u) => u.username === 'admin')!;

beforeEach(() => {
  clearMockSession();
  gcMockDb.reset(new Date());
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
    // Non-gc offsets: ppa -2,0,3,12,45 + legal 0,12,25,80. Generated gc alerts (60/30/7/0 windows,
    // overdue >30d dropped): expiring ends at 0,3,7,25,45,60; expired -1,-10,-25 (<0, not bucketed).
    // 0..7: ppa 0,3 + legal 0 + gc 0,3,7 = 6; 8..30: ppa 12 + legal 12,25 + gc 25 = 4;
    // 31..90: ppa 45 + legal 80 + gc 45,60 = 4.
    expect(buildHomeView(data, admin).alertBuckets).toEqual({
      within7: 6,
      within30: 4,
      within90: 4,
    });
  });

  it('filters by the session user modules', async () => {
    setMockSession('ppa.user', false);
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    expect(data.modules.map((m) => m.module)).toEqual(['ppa']);
    expect(data.alerts.every((a) => a.module === 'ppa')).toBe(true);
  });
});
