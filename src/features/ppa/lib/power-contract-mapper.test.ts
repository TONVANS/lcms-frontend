import { describe, expect, it } from 'vitest';
import { toPowerContract, toPowerContractsDashboard } from './power-contract-mapper';

describe('toPowerContract', () => {
  it('coerces numeric strings, ISO datetimes and enums', () => {
    const c = toPowerContract({
      id: 'x1',
      contractType: 'PURCHASE',
      contractNumber: 'PPA-1',
      projectName: 'P',
      projectTypeOrCustomer: 'ໄຟຟ້ານໍ້າຕົກ',
      durationMonths: '300',
      signedDate: '2026-01-15T00:00:00.000Z',
      expirationDate: '2051-02-01',
      capacityValue: '50.00',
      capacityUnit: 'MW',
      tariffValue: '0.065',
      tariffCurrency: 'USD',
      notifyDaysBefore: '60',
      status: 'ACTIVE',
    });
    expect(c.durationMonths).toBe(300);
    expect(c.signedDate).toBe('2026-01-15');
    expect(c.capacityValue).toBe(50);
    expect(c.tariffValue).toBe(0.065);
    expect(c.tariffCurrency).toBe('USD');
    expect(c.notifyDaysBefore).toBe(60);
    expect(c.effectiveDate).toBeNull();
    expect(c.status).toBe('ACTIVE');
  });

  it('is tolerant of junk and missing fields', () => {
    const c = toPowerContract({ id: 5, contractType: 'weird', status: 'nope', capacityUnit: 'kw' });
    expect(c.id).toBe('5');
    expect(c.contractType).toBe('PURCHASE');
    expect(c.status).toBe('DRAFT');
    expect(c.capacityUnit).toBe('kW');
    expect(c.capacityValue).toBeNull();
    expect(toPowerContract(null).id).toBe('');
  });

  it('falls back to parsing installedCapacity and tariff text', () => {
    const c = toPowerContract({
      id: 'a',
      installedCapacity: '150 kW',
      tariff: '850 LAK/kWh',
    });
    expect(c.capacityValue).toBe(150);
    expect(c.capacityUnit).toBe('kW');
    expect(c.tariffValue).toBe(850);
    expect(c.tariffCurrency).toBe('LAK');
  });
});

describe('toPowerContractsDashboard', () => {
  it('maps object maps and converts kW to MW', () => {
    const d = toPowerContractsDashboard({
      total: '10',
      byStatus: { ACTIVE: 6, EXPIRED: '2' },
      byContractType: { PURCHASE: 7, SALE: 3 },
      totalCapacityKw: 2500,
      byProjectType: [
        { projectType: 'A', count: 2, capacityKw: 1500 },
        { projectTypeOrCustomer: 'B', _count: 1, capacityMw: '3.5' },
      ],
      expiringSoon: [{ id: 'e1', contractNumber: 'N', status: 'EXPIRING_SOON' }],
    });
    expect(d.total).toBe(10);
    expect(d.byStatus).toHaveLength(5);
    expect(d.byStatus.find((s) => s.status === 'ACTIVE')?.count).toBe(6);
    expect(d.byStatus.find((s) => s.status === 'EXPIRED')?.count).toBe(2);
    expect(d.purchaseCount).toBe(7);
    expect(d.saleCount).toBe(3);
    expect(d.totalCapacityMw).toBe(2.5);
    expect(d.byProjectType).toEqual([
      { projectType: 'A', count: 2, capacityMw: 1.5 },
      { projectType: 'B', count: 1, capacityMw: 3.5 },
    ]);
    expect(d.expiringSoon[0].id).toBe('e1');
  });

  it('maps array groupBy and falls back to sums', () => {
    const d = toPowerContractsDashboard({
      byStatus: [
        { status: 'ACTIVE', count: 4 },
        { status: 'DRAFT', _count: { _all: 1 } },
      ],
      byProjectType: { X: { count: 2, capacityMw: 10 } },
    });
    expect(d.total).toBe(5);
    expect(d.byStatus.find((s) => s.status === 'DRAFT')?.count).toBe(1);
    expect(d.byProjectType).toEqual([{ projectType: 'X', count: 2, capacityMw: 10 }]);
    expect(d.totalCapacityMw).toBe(10);
    expect(d.expiringSoon).toEqual([]);
  });
});
