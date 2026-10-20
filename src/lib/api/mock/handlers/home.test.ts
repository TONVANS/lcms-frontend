import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { buildHomeView } from '@/features/home/lib/build-home-view';
import type { HomeSummary } from '@/features/home/types';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

const admin = MOCK_USERS.find((u) => u.username === 'admin')!;

beforeEach(() => clearMockSession());

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
    // Admin mock offsets: 0..7 -> 0,0,3,7 = 4; 8..30 -> 12,12,25,25,30 = 5; 31..90 -> 45,80,80 = 3
    expect(buildHomeView(data, admin).alertBuckets).toEqual({
      within7: 4,
      within30: 5,
      within90: 3,
    });
  });

  it('filters by the session user modules', async () => {
    setMockSession('ppa.user', false);
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    expect(data.modules.map((m) => m.module)).toEqual(['ppa']);
    expect(data.alerts.every((a) => a.module === 'ppa')).toBe(true);
  });
});
