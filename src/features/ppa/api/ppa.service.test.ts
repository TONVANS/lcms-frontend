import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { ppaService } from './ppa.service';

describe('ppaService', () => {
  beforeEach(() => {
    installMocks(api, { delay: 0 });
  });

  it('lists contracts with pagination', async () => {
    const res = await ppaService.list({ page: 1, pageSize: 5 });
    expect(res.items.length).toBeLessThanOrEqual(5);
    expect(res.total).toBeGreaterThanOrEqual(20);
    expect(res.page).toBe(1);
  });

  it('gets a contract detail by id', async () => {
    const contract = await ppaService.get('ppa-1');
    expect(contract.id).toBe('ppa-1');
    expect(contract.contractNo).toBeDefined();
  });

  it('creates a new contract', async () => {
    const created = await ppaService.create({
      contractNo: 'PPA-NEW-001',
      projectName: 'ໂຄງການໃໝ່',
      developerName: 'EDL',
      energyType: 'solar',
      capacityMw: 100,
      tariffUsCentPerKwh: 5.5,
      market: 'domestic',
    });

    expect(created.id).toBeDefined();
    expect(created.contractNo).toBe('PPA-NEW-001');
  });

  it('fetches dashboard summary with KPIs and breakdowns', async () => {
    const summary = await ppaService.dashboard();
    expect(summary.kpis.totalContracts).toBeGreaterThanOrEqual(20);
    expect(summary.kpis.activeCapacityMw).toBeGreaterThan(0);
    expect(summary.energyBreakdown.length).toBeGreaterThan(0);
    expect(summary.statusBreakdown.length).toBeGreaterThan(0);
  });
});
