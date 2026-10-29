import type MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { powerMockDb } from '../mocks/ppa.mock';
import { ppaService } from './ppa.service';

let mock: MockAdapter;

beforeEach(() => {
  mock = installMocks(api, { delay: 0 });
  clearMockSession();
  setMockSession('ppa.user', false);
  powerMockDb.reset();
});

describe('ppaService', () => {
  it('maps list query names and omits empty values', async () => {
    await ppaService.list({
      page: 2,
      pageSize: 20,
      q: '  PPA ',
      contractType: 'SALE',
      status: undefined,
      projectTypeOrCustomer: '',
    });
    const params = mock.history.get[0].params as Record<string, unknown>;
    expect(params).toEqual({ page: 2, limit: 20, search: 'PPA', contractType: 'SALE' });
  });

  it('returns mapped models and totals', async () => {
    const res = await ppaService.list({ page: 1, pageSize: 5 });
    expect(res.items).toHaveLength(5);
    expect(res.total).toBeGreaterThanOrEqual(25);
    expect(res.page).toBe(1);
    expect(res.pageSize).toBe(5);
    expect(typeof res.items[0].capacityValue === 'number' || res.items[0].capacityValue === null).toBe(true);
    expect(res.items[0].signedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('gets, creates, updates and removes', async () => {
    const got = await ppaService.get('ppa-1');
    expect(got.contractNumber).toBe('PPA-EDL-2010-001');

    const created = await ppaService.create({
      contractType: 'SALE',
      contractNumber: 'SVC-NEW-1',
      projectName: 'N',
      projectTypeOrCustomer: 'Customer',
    });
    expect(created.id).toBeTruthy();
    expect(created.contractType).toBe('SALE');

    const patched = await ppaService.update(created.id, { projectName: 'Renamed' });
    expect(patched.projectName).toBe('Renamed');

    await ppaService.remove(created.id);
    await expect(ppaService.get(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it('rejects a duplicate contractNumber with 409', async () => {
    await expect(
      ppaService.create({
        contractType: 'PURCHASE',
        contractNumber: 'PPA-EDL-2010-001',
        projectName: 'x',
        projectTypeOrCustomer: 'y',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('loads the dashboard with kW converted to MW', async () => {
    const d = await ppaService.dashboard();
    expect(d.total).toBe(powerMockDb.all().length);
    expect(d.byStatus).toHaveLength(5);
    expect(d.purchaseCount + d.saleCount).toBe(d.total);
    expect(d.totalCapacityMw).toBeGreaterThan(0);
    const sum = d.byProjectType.reduce((s, p) => s + p.capacityMw, 0);
    expect(d.totalCapacityMw).toBeCloseTo(sum, 3);
    expect(d.expiringSoon.length).toBeGreaterThan(0);
    expect(d.expiringSoon.every((c) => c.status === 'EXPIRING_SOON')).toBe(true);
  });
});
