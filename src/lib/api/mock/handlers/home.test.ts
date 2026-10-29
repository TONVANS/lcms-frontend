import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { buildHomeView } from '@/features/home/lib/build-home-view';
import type { HomeSummary } from '@/features/home/types';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { gcMockDb } from '@/features/gc/mocks/gc.mock';
import { legalCasesMockDb } from '@/features/legal/cases/mocks/legal-cases.mock';
import { legalDocumentsMockDb } from '@/features/legal/documents/mocks/legal-documents.mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

const admin = MOCK_USERS.find((u) => u.username === 'admin')!;

beforeEach(() => {
  clearMockSession();
  gcMockDb.reset(new Date());
  legalDocumentsMockDb.reset(new Date());
  legalCasesMockDb.reset(new Date());
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
    // Only the static (non-gc) alerts remain: ppa offsets -2,0,3,12,45 (GC alerts come from /notifications).
    expect(buildHomeView(data, admin).alertBuckets).toEqual({
      within7: 2,
      within30: 1,
      within90: 1,
    });
  });

  it('reports gc active as active only (expiring is its own count), matching the gc dashboard', async () => {
    setMockSession('admin', false);
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    const gc = data.modules.find((m) => m.module === 'gc')!;
    const statuses = gcMockDb.all().map((c) => c.status);
    const count = (s: string) => statuses.filter((x) => x === s).length;
    expect(count('EXPIRING_SOON')).toBeGreaterThan(0);
    expect(gc).toEqual({
      module: 'gc',
      total: statuses.length,
      active: count('ACTIVE'),
      expiring: count('EXPIRING_SOON'),
    });
  });

  it('reports legal stats from legal mock dbs, matching the legal modules', async () => {
    setMockSession('admin', false);
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    const legal = data.modules.find((m) => m.module === 'legal')!;
    const regs = legalDocumentsMockDb.all();
    const cases = legalCasesMockDb.all();
    const activeRegs = regs.filter((r) => r.status === 'ACTIVE').length;
    const activeCases = cases.filter((c) => c.disputeStatus !== 'CLOSED' && c.disputeStatus !== 'RESOLVED').length;
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
