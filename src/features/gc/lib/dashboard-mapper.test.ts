import { describe, expect, it } from 'vitest';
import { toContractsDashboard } from './dashboard-mapper';

describe('toContractsDashboard', () => {
  it('accepts object maps', () => {
    const d = toContractsDashboard({
      data: {
        total: '30',
        expiringSoonCount: 4,
        expiredCount: 2,
        byStatus: { ACTIVE: 3, EXPIRED: '2' },
        byCurrency: { LAK: 10, USD: 5 },
        valueByCurrency: { LAK: '1000.5', USD: 20 },
        byContractType: [{ contractTypeId: 1, name: 'O&M', count: 7 }],
      },
    });
    expect(d.total).toBe(30);
    expect(d.byStatus.find((s) => s.status === 'ACTIVE')?.count).toBe(3);
    expect(d.byStatus.find((s) => s.status === 'EXPIRED')?.count).toBe(2);
    expect(d.byStatus.find((s) => s.status === 'DRAFT')?.count).toBe(0);
    expect(d.byCurrency).toEqual([
      { currency: 'LAK', count: 10 },
      { currency: 'USD', count: 5 },
    ]);
    expect(d.valueByCurrency).toEqual([
      { currency: 'LAK', amount: 1000.5 },
      { currency: 'USD', amount: 20 },
    ]);
    expect(d.byContractType).toEqual([{ contractTypeId: 1, name: 'O&M', count: 7 }]);
  });

  it('accepts arrays in Prisma groupBy style', () => {
    const d = toContractsDashboard({
      total: 5,
      byStatus: [{ status: 'ACTIVE', _count: { _all: 3 } }, { status: 'DRAFT', count: 2 }],
      byCurrency: [{ currency: 'CNY', _count: 1 }],
      valueByCurrency: [{ currency: 'LAK', _sum: { contractValue: '900' } }],
      byContractType: [{ contractTypeId: 2, contractType: { nameLo: 'ດິນ' }, _count: { _all: 4 } }],
    });
    expect(d.byStatus.find((s) => s.status === 'ACTIVE')?.count).toBe(3);
    expect(d.byStatus.find((s) => s.status === 'DRAFT')?.count).toBe(2);
    expect(d.byCurrency).toEqual([{ currency: 'CNY', count: 1 }]);
    expect(d.valueByCurrency).toEqual([{ currency: 'LAK', amount: 900 }]);
    expect(d.byContractType).toEqual([{ contractTypeId: 2, name: 'ດິນ', count: 4 }]);
    expect(d.expiringSoonCount).toBe(0);
  });

  it('derives counts from byStatus when absent and survives garbage', () => {
    const d = toContractsDashboard({ byStatus: { EXPIRING_SOON: 2, EXPIRED: 1 } });
    expect(d.expiringSoonCount).toBe(2);
    expect(d.expiredCount).toBe(1);
    expect(d.total).toBe(3);
    expect(toContractsDashboard(null).total).toBe(0);
  });
});
