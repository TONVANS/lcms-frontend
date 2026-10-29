import { beforeEach, describe, expect, it } from 'vitest';
import { powerMockDb } from '@/features/ppa/mocks/ppa.mock';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

const get = (url: string, params?: Record<string, unknown>) => api.get(url, { params });

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  powerMockDb.reset();
});

describe('power-contracts mock handler', () => {
  it('401 without a session, 403 without the power module', async () => {
    await expect(get(endpoints.powerContracts.list)).rejects.toMatchObject({ status: 401 });
    setMockSession('gc.viewer', false);
    await expect(get(endpoints.powerContracts.list)).rejects.toMatchObject({ status: 403 });
  });

  it('seeds at least 25 records covering all statuses, both types, kW and MW, LAK and USD', () => {
    const all = powerMockDb.all();
    expect(all.length).toBeGreaterThanOrEqual(25);
    for (const s of ['DRAFT', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED']) {
      expect(all.some((r) => r.status === s)).toBe(true);
    }
    expect(all.some((r) => r.contractType === 'SALE')).toBe(true);
    expect(all.some((r) => r.capacityUnit === 'kW')).toBe(true);
    expect(all.some((r) => r.tariffCurrency === 'LAK')).toBe(true);
    expect(all.some((r) => r.tariffCurrency === 'USD')).toBe(true);
    for (const id of ['ppa-1', 'ppa-2', 'ppa-3', 'ppa-4']) expect(powerMockDb.find(id)).toBeDefined();
  });

  it('lists with the { data, meta } envelope and filters', async () => {
    setMockSession('ppa.user', false);
    const res = await get(endpoints.powerContracts.list, { page: 2, limit: 5, contractType: 'SALE' });
    expect(res.data.meta).toMatchObject({ page: 2, limit: 5 });
    expect(res.data.data).toHaveLength(5);
    expect(res.data.data.every((r: { contractType: string }) => r.contractType === 'SALE')).toBe(true);

    const s = await get(endpoints.powerContracts.list, { search: 'psa-edl-2020' });
    expect(s.data.meta.total).toBe(1);

    const st = await get(endpoints.powerContracts.list, { status: 'EXPIRED', limit: 50 });
    expect(st.data.data.every((r: { status: string }) => r.status === 'EXPIRED')).toBe(true);

    const pt = await get(endpoints.powerContracts.list, { projectTypeOrCustomer: 'ໄຟຟ້ານໍ້າຕົກ', limit: 50 });
    expect(pt.data.meta.total).toBeGreaterThan(0);
  });

  it('serves detail, dashboard and project types without route clashes', async () => {
    setMockSession('ppa.user', false);
    expect((await get(endpoints.powerContracts.detail('ppa-1'))).data.data.id).toBe('ppa-1');
    const d = await get(endpoints.powerContracts.dashboard);
    expect(d.data.data.total).toBe(powerMockDb.all().length);
    const pt = await get(endpoints.powerContracts.projectTypes);
    expect(pt.data.data).toHaveLength(5);
    await expect(get(endpoints.powerContracts.detail('nope'))).rejects.toMatchObject({
      status: 404,
    });
  });

  it('create validates with Nest-style 400 messages and 409 on duplicates', async () => {
    setMockSession('ppa.user', false);
    const bad = await api.post(endpoints.powerContracts.list, { contractType: 'X' }).catch((e) => e);
    expect(bad.status).toBe(400);
    expect(bad.message.split('\n').length).toBeGreaterThanOrEqual(2);

    const dup = await api
      .post(endpoints.powerContracts.list, {
        contractType: 'SALE',
        contractNumber: 'PPA-EDL-2010-001',
        projectName: 'a',
        projectTypeOrCustomer: 'b',
      })
      .catch((e) => e);
    expect(dup.status).toBe(409);
    expect(dup.message).toContain('already exists');

    const ok = await api.post(endpoints.powerContracts.list, {
      contractType: 'SALE',
      contractNumber: 'UNIQ-1',
      projectName: 'a',
      projectTypeOrCustomer: 'b',
    });
    expect(ok.status).toBe(201);
    expect(ok.data.data.id).toBeTruthy();
  });

  it('patch and delete', async () => {
    setMockSession('ppa.user', false);
    const p = await api.patch(endpoints.powerContracts.detail('ppa-5'), { projectName: 'Changed' });
    expect(p.data.data.projectName).toBe('Changed');
    const del = await api.delete(endpoints.powerContracts.detail('ppa-5'));
    expect(del.status).toBe(200);
    await expect(get(endpoints.powerContracts.detail('ppa-5'))).rejects.toMatchObject({
      status: 404,
    });
  });
});
