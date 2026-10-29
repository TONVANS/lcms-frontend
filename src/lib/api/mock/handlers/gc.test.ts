import { beforeEach, describe, expect, it } from 'vitest';
import { gcService } from '@/features/gc/api/gc.service';
import { gcMockDb } from '@/features/gc/mocks/gc.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  gcMockDb.reset(new Date());
});

describe('mock data', () => {
  it('has >= 25 records covering every status and currency with varied types', () => {
    const all = gcMockDb.all();
    expect(all.length).toBeGreaterThanOrEqual(25);
    expect(new Set(all.map((c) => c.status)).size).toBe(5);
    expect(new Set(all.map((c) => c.currency).filter(Boolean)).size).toBe(3);
    expect(new Set(all.map((c) => c.contractTypeId)).size).toBe(14);
    expect(all.slice(0, 8).map((c) => c.id)).toEqual(
      Array.from({ length: 8 }, (_, i) => `gc-00${i + 1}`),
    );
    expect(all.some((c) => typeof c.contractValue === 'string')).toBe(true);
  });
});

describe('gc handlers', () => {
  it('401 without a session', async () => {
    await expect(gcService.list()).rejects.toMatchObject({ status: 401 });
  });

  it('list filters and paginates with the backend envelope', async () => {
    setMockSession('gc.viewer', false);
    const raw = await api.get('/contracts', { params: { status: 'EXPIRED', page: 1, limit: 2 } });
    expect(raw.data.meta).toMatchObject({ page: 1, limit: 2 });
    expect(raw.data.meta.total).toBe(gcMockDb.all().filter((c) => c.status === 'EXPIRED').length);
    expect(raw.data.meta.totalPages).toBe(Math.ceil(raw.data.meta.total / 2));
    expect(raw.data.data.length).toBeLessThanOrEqual(2);

    const typed = await gcService.list({ contractTypeId: 1, page: 1, pageSize: 50 });
    expect(typed.items.length).toBeGreaterThan(0);
    expect(typed.items.every((c) => c.contractTypeId === 1)).toBe(true);

    const found = await gcService.list({ q: 'GC-2026-003' });
    expect(found.items.map((c) => c.contractNumber)).toEqual(['GC-2026-003']);
  });

  it('detail has nested contractType; unknown id is 404', async () => {
    setMockSession('gc.viewer', false);
    const c = await gcService.get('gc-001');
    expect(c.contractType?.id).toBe(c.contractTypeId);
    await expect(gcService.get('nope')).rejects.toMatchObject({ status: 404 });
  });

  it('create requires permission; 400 Nest-style on missing required; 409 on duplicate number', async () => {
    setMockSession('gc.viewer', false);
    await expect(gcService.create({ title: 'a' })).rejects.toMatchObject({ status: 403 });

    setMockSession('gc.editor', false);
    const bad = await api.post('/contracts', { title: '' }, { validateStatus: () => true });
    expect(bad.status).toBe(400);
    expect(Array.isArray(bad.data.message)).toBe(true);
    expect(bad.data.message.length).toBeGreaterThanOrEqual(2);

    const dup = await api.post(
      '/contracts',
      { title: 'x', contractTypeId: 1, contractNumber: 'GC-2026-001' },
      { validateStatus: () => true },
    );
    expect(dup.status).toBe(409);
    expect(typeof dup.data.message).toBe('string');

    const created = await gcService.create({ title: 'New', contractTypeId: 2, contractNumber: 'NEW-1', contractValue: 5, currency: 'USD' });
    expect(created.contractType?.id).toBe(2);
    expect(created.contractValue).toBe(5);
    expect((await gcService.list({ q: 'NEW-1' })).total).toBe(1);
  });

  it('patch changes only given fields; delete removes', async () => {
    setMockSession('gc.editor', false);
    const before = await gcService.get('gc-002');
    const after = await gcService.update('gc-002', { implementer: 'Z' });
    expect(after.implementer).toBe('Z');
    expect(after.title).toBe(before.title);
    await expect(gcService.update('gc-002', { contractNumber: 'GC-2026-001' })).rejects.toMatchObject({ status: 409 });
    await gcService.remove('gc-002');
    await expect(gcService.get('gc-002')).rejects.toMatchObject({ status: 404 });
  });

  it('dashboard returns the backend field names', async () => {
    setMockSession('gc.viewer', false);
    const raw = await api.get('/contracts/dashboard');
    const d = raw.data.data;
    expect(d.total).toBe(gcMockDb.all().length);
    for (const k of ['expiringSoonCount', 'expiredCount', 'byStatus', 'byCurrency', 'valueByCurrency', 'byContractType']) {
      expect(d).toHaveProperty(k);
    }
    const mapped = await gcService.dashboard();
    expect(mapped.expiredCount).toBe(gcMockDb.all().filter((c) => c.status === 'EXPIRED').length);
    expect(mapped.valueByCurrency.length).toBe(3);
  });
});
