import { beforeEach, describe, expect, it } from 'vitest';
import { alertsService } from '@/features/alerts/api/alerts.service';
import { gcService } from '@/features/gc/api/gc.service';
import { deriveGcStatus } from '@/features/gc/lib/derive-status';
import { gcMockDb } from '@/features/gc/mocks/gc.mock';
import type { GcContractInput } from '@/features/gc/schemas/gc.schema';
import type { GeneralContract } from '@/features/gc/types';
import type { HomeSummary } from '@/features/home/types';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { daysLeft } from '@/lib/utils/date';

const toInput = (c: GeneralContract): GcContractInput => ({
  title: c.title,
  type: c.type,
  contractNo: c.contractNo,
  counterparty: c.counterparty,
  termText: c.termText,
  signedDate: c.signedDate,
  effectiveDate: c.effectiveDate,
  endDate: c.endDate,
  value: c.value,
  equity: c.equity,
  implementer: c.implementer,
  notes: c.notes,
});

const input: GcContractInput = {
  title: 'New contract',
  type: 'moa',
  contractNo: 'NEW-001',
  counterparty: null,
  termText: null,
  signedDate: '2026-10-01',
  effectiveDate: '2026-10-02',
  endDate: null,
  value: null,
  equity: null,
  implementer: null,
  notes: null,
};

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  gcMockDb.reset(new Date());
});

describe('gc handlers', () => {
  it('401 without a session', async () => {
    await expect(gcService.list()).rejects.toMatchObject({ status: 401 });
  });

  it('list filters, sorts and paginates on the server', async () => {
    setMockSession('gc.viewer', false);
    const r = await gcService.list({ status: 'expiring', page: 1, pageSize: 10 });
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items.every((c) => deriveGcStatus(c) === 'expiring')).toBe(true);
    expect(r.total).toBe(r.items.length);
    const endDates = r.items.map((c) => c.endDate);
    expect(endDates).toEqual([...endDates].sort());
  });

  it('paginates and searches', async () => {
    setMockSession('gc.viewer', false);
    const p2 = await gcService.list({ page: 2, pageSize: 20 });
    expect(p2.items).toHaveLength(20);
    expect(p2.total).toBe(42);
    const first = gcMockDb.all()[0];
    const q = await gcService.list({ q: first.contractNo.toLowerCase() });
    expect(q.items.map((c) => c.id)).toContain(first.id);
    expect(q.total).toBe(1);
  });

  it('puts open-ended contracts last in either direction', async () => {
    setMockSession('gc.viewer', false);
    for (const order of ['asc', 'desc'] as const) {
      const r = await gcService.list({ sort: 'endDate', order, pageSize: 50 });
      const ends = r.items.map((c) => c.endDate);
      const firstNull = ends.indexOf(null);
      expect(firstNull).toBeGreaterThan(-1);
      expect(ends.slice(firstNull).every((e) => e === null)).toBe(true);
    }
  });

  it('sorts titles with Lao collation, not code-point order', async () => {
    setMockSession('gc.editor', false);
    // A leading vowel (U+0EC0) sorts after every consonant by code point, but collates by the consonant that follows it.
    const lead = await gcService.create({ ...input, contractNo: 'LAO-1', title: '\u0EC0\u0E81' });
    const plain = await gcService.create({ ...input, contractNo: 'LAO-2', title: '\u0E82' });
    expect('\u0EC0\u0E81' < '\u0E82').toBe(false);
    const r = await gcService.list({ sort: 'title', order: 'asc', pageSize: 50 });
    const ids = r.items.map((c) => c.id);
    expect(ids.indexOf(lead.id)).toBeLessThan(ids.indexOf(plain.id));
    const titles = r.items.map((c) => c.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'lo')));
  });

  it('ignores invalid query values', async () => {
    setMockSession('gc.viewer', false);
    const r = await gcService.list({ status: 'bogus' as never, pageSize: 999, page: -2 });
    expect(r.pageSize).toBe(10);
    expect(r.page).toBe(1);
    expect(r.total).toBe(42);
  });

  it('viewer gets 403 on create, edit and delete; editor succeeds on create', async () => {
    setMockSession('gc.viewer', false);
    const [first] = gcMockDb.all();
    await expect(gcService.create(input)).rejects.toMatchObject({ status: 403 });
    await expect(gcService.update(first.id, toInput(first))).rejects.toMatchObject({ status: 403 });
    await expect(gcService.remove(first.id)).rejects.toMatchObject({ status: 403 });
    expect(gcMockDb.get(first.id)).toBeDefined();
    setMockSession('gc.editor', false);
    await expect(gcService.create(input)).resolves.toMatchObject({ contractNo: input.contractNo });
  });

  it('a user without gc access gets 403 on read', async () => {
    setMockSession('ppa.user', false);
    await expect(gcService.list()).rejects.toMatchObject({ status: 403 });
  });

  it('duplicate contractNo -> 409 with field error; editing self keeps own number', async () => {
    setMockSession('gc.editor', false);
    const [first, second] = gcMockDb.all();
    await expect(
      gcService.update(second.id, { ...toInput(second), contractNo: first.contractNo.toLowerCase() }),
    ).rejects.toMatchObject({ status: 409, fieldErrors: { contractNo: 'DUPLICATE_CONTRACT_NO' } });
    await expect(gcService.update(first.id, toInput(first))).resolves.toMatchObject({ id: first.id });
    await expect(
      gcService.update(first.id, { ...toInput(first), contractNo: first.contractNo.toUpperCase() }),
    ).resolves.toMatchObject({ id: first.id });
    await expect(
      gcService.create({ ...input, contractNo: first.contractNo.toUpperCase() }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('PATCH with null clears value; unknown id is 404; delete removes', async () => {
    setMockSession('gc.editor', false);
    const withValue = gcMockDb.all().find((c) => c.value !== null)!;
    await gcService.update(withValue.id, { ...toInput(withValue), value: null });
    expect((await gcService.get(withValue.id)).value).toBeNull();
    await expect(gcService.get('nope')).rejects.toMatchObject({ status: 404 });
    await expect(gcService.update('nope', input)).rejects.toMatchObject({ status: 404 });
    await gcService.remove(withValue.id);
    await expect(gcService.get(withValue.id)).rejects.toMatchObject({ status: 404 });
  });

  it('dashboard route is not captured by detail', async () => {
    setMockSession('gc.viewer', false);
    const d = await gcService.dashboard();
    expect(d.total).toBe(42);
    expect(d.byType).toHaveLength(14);
    expect(Object.values(d.byStatus).reduce((a, b) => a + b, 0)).toBe(42);
  });

  it('dashboard byStatus equals the list endpoint count per status', async () => {
    setMockSession('gc.viewer', false);
    const d = await gcService.dashboard();
    for (const status of ['pending', 'active', 'expiring', 'expired'] as const) {
      const listed = await gcService.list({ status, pageSize: 10 });
      expect(d.byStatus[status], status).toBe(listed.total);
    }
  });

  it('dashboard upcoming is 0..90 days, ascending, capped at 10, no expired or open-ended', async () => {
    setMockSession('gc.viewer', false);
    const { upcoming } = await gcService.dashboard();
    expect(upcoming.length).toBeGreaterThan(0);
    expect(upcoming.length).toBeLessThanOrEqual(10);
    const ends = upcoming.map((c) => c.endDate);
    expect(ends.every((e) => e !== null)).toBe(true);
    expect([...ends].sort()).toEqual(ends);
    const today = new Date();
    for (const c of upcoming) {
      const left = daysLeft(c.endDate, today)!;
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(90);
      expect(deriveGcStatus(c, today)).not.toBe('expired');
    }
  });

  it('dashboard upcoming is capped at 10 even when more qualify', async () => {
    setMockSession('gc.user', false);
    const base = gcMockDb.all()[0]!;
    for (let i = 0; i < 6; i += 1) {
      await gcService.create({ ...toInput(base), contractNo: `CAP-${i}` });
    }
    const { upcoming } = await gcService.dashboard();
    expect(upcoming).toHaveLength(10);
  });
});

describe('alerts and home integration', () => {
  it('alerts include generated gc alerts and persist read state', async () => {
    setMockSession('gc.user', false);
    const alerts = await alertsService.list({ module: 'gc' });
    expect(alerts.some((a) => a.id.endsWith('-w60'))).toBe(true);
    expect(alerts.every((a) => a.module === 'gc')).toBe(true);
    const target = alerts[0];
    await alertsService.markRead(target.id);
    const again = await alertsService.list({ module: 'gc' });
    expect(again.find((a) => a.id === target.id)?.read).toBe(true);
  });

  it('home gc stats come from the gc db', async () => {
    setMockSession('gc.user', false);
    const { data } = await api.get<HomeSummary>(endpoints.home.summary);
    const gc = data.modules.find((m) => m.module === 'gc')!;
    const statuses = gcMockDb.all().map((c) => deriveGcStatus(c));
    const expiring = statuses.filter((s) => s === 'expiring').length;
    expect(gc).toEqual({
      module: 'gc',
      total: 42,
      active: statuses.filter((s) => s === 'active').length + expiring,
      expiring,
    });
  });
});
