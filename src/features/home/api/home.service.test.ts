import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gcService } from '@/features/gc';
import { legalCasesService, legalDocumentsService } from '@/features/legal';
import { ppaService } from '@/features/ppa';
import type { SystemModule, User } from '@/types/domain';
import { homeService } from './home.service';

const user = (role: User['role'], modules: SystemModule[]): User =>
  ({ role, accessibleModules: modules }) as User;

const gcDash = { total: 2, expiringSoonCount: 1, byStatus: [{ status: 'ACTIVE', count: 1 }] };
const ppaDash = {
  total: 3,
  totalCapacityMw: 10,
  expiringSoon: [
    { id: 'p1', projectName: 'P', contractNumber: 'X', expirationDate: '2026-11-02' },
  ],
};
const docs = { total: 4, active: 3 };
const cases = { total: 2, byDisputeStatus: [{ status: 'APPEAL', count: 2 }] };

let spies: Record<string, ReturnType<typeof vi.fn>>;
beforeEach(() => {
  vi.restoreAllMocks();
  spies = {
    gcDash: vi.spyOn(gcService, 'dashboard').mockResolvedValue(gcDash as never) as never,
    gcList: vi.spyOn(gcService, 'list').mockResolvedValue({
      items: [{ id: 'g1', title: 'G', contractNumber: 'N', expirationDate: '2026-11-01' }],
    } as never) as never,
    ppa: vi.spyOn(ppaService, 'dashboard').mockResolvedValue(ppaDash as never) as never,
    docs: vi.spyOn(legalDocumentsService, 'dashboard').mockResolvedValue(docs as never) as never,
    cases: vi.spyOn(legalCasesService, 'dashboard').mockResolvedValue(cases as never) as never,
  };
});

describe('homeService.load', () => {
  it('fetches only the sources the user can see', async () => {
    const r = await homeService.load(user('VIEWER', ['legal-cases']));
    expect(Object.keys(r.modules)).toEqual(['legal']);
    expect(spies.cases).toHaveBeenCalled();
    expect(spies.docs).not.toHaveBeenCalled();
    expect(spies.gcDash).not.toHaveBeenCalled();
    expect(spies.gcList).not.toHaveBeenCalled();
    expect(spies.ppa).not.toHaveBeenCalled();
    expect(r.upcoming).toEqual([]);
  });

  it('requests the 10 nearest EXPIRING_SOON gc contracts', async () => {
    await homeService.load(user('VIEWER', ['contracts']));
    expect(spies.gcList).toHaveBeenCalledWith({ status: 'EXPIRING_SOON', page: 1, pageSize: 10 });
  });

  it('admin: all modules, upcoming merged and sorted', async () => {
    const r = await homeService.load(user('ADMIN', []));
    expect(Object.keys(r.modules)).toEqual(['ppa', 'gc', 'legal']);
    expect(r.upcoming.map((i) => i.href)).toEqual(['/contracts/g1', '/ppa/contracts/p1']);
    expect(r.upcomingFailed).toBe(false);
  });

  it('a failing module is flagged, the others still resolve', async () => {
    spies.gcDash.mockRejectedValue(new Error('boom'));
    const r = await homeService.load(user('ADMIN', []));
    expect(r.modules.gc).toEqual({ ok: false });
    expect(r.modules.ppa?.ok).toBe(true);
    expect(r.modules.legal?.ok).toBe(true);
  });

  it('legal degrades to the surviving dashboard, fails only when all fail', async () => {
    spies.docs.mockRejectedValue(new Error('x'));
    const partial = await homeService.load(user('ADMIN', []));
    const legal = partial.modules.legal;
    expect(legal?.ok && legal.card.metrics.map((m) => m.id)).toEqual(['casesTotal', 'casesOpen']);
    spies.cases.mockRejectedValue(new Error('y'));
    const none = await homeService.load(user('ADMIN', []));
    expect(none.modules.legal).toEqual({ ok: false });
  });

  it('a failing gc list keeps ppa upcoming and flags the failure', async () => {
    spies.gcList.mockRejectedValue(new Error('x'));
    const r = await homeService.load(user('ADMIN', []));
    expect(r.upcoming.map((i) => i.module)).toEqual(['ppa']);
    expect(r.upcomingFailed).toBe(true);
  });

  it('no business module: no requests', async () => {
    const r = await homeService.load(user('VIEWER', ['support']));
    expect(r.modules).toEqual({});
    expect(Object.values(spies).every((s) => !s.mock.calls.length)).toBe(true);
  });
});
