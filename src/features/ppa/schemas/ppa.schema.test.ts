import { describe, expect, it } from 'vitest';
import type { PowerContract } from '../types';
import {
  diffPayload,
  emptyPowerForm,
  fromPowerContract,
  powerContractSchema,
  toPowerContractPayload,
} from './ppa.schema';

const valid = () => ({
  ...emptyPowerForm(),
  contractType: 'PURCHASE' as const,
  projectName: 'Proj',
  projectTypeOrCustomer: 'ໄຟຟ້ານໍ້າຕົກ',
});

describe('powerContractSchema', () => {
  it('accepts the minimal valid form and defaults notifyDaysBefore to 60', () => {
    expect(powerContractSchema.safeParse(valid()).success).toBe(true);
    expect(emptyPowerForm().notifyDaysBefore).toBe(60);
  });

  it('requires projectName and projectTypeOrCustomer', () => {
    const r = powerContractSchema.safeParse({ ...valid(), projectName: ' ', projectTypeOrCustomer: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('projectName');
      expect(paths).toContain('projectTypeOrCustomer');
    }
  });

  it('rejects negative capacity and tariff', () => {
    expect(powerContractSchema.safeParse({ ...valid(), capacityValue: -1 }).success).toBe(false);
    expect(powerContractSchema.safeParse({ ...valid(), tariffValue: -0.1 }).success).toBe(false);
    expect(powerContractSchema.safeParse({ ...valid(), capacityValue: 0 }).success).toBe(true);
  });

  it('requires integer notifyDaysBefore', () => {
    expect(powerContractSchema.safeParse({ ...valid(), notifyDaysBefore: 1.5 }).success).toBe(false);
  });

  it('requires expiration >= effective', () => {
    const bad = powerContractSchema.safeParse({
      ...valid(),
      effectiveDate: '2026-05-01',
      expirationDate: '2026-04-30',
    });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.error.issues[0].path[0]).toBe('expirationDate');
    expect(
      powerContractSchema.safeParse({ ...valid(), effectiveDate: '2026-05-01', expirationDate: '2026-05-01' })
        .success,
    ).toBe(true);
  });
});

describe('toPowerContractPayload', () => {
  it('composes installedCapacity and tariff and omits empty values', () => {
    const p = toPowerContractPayload({
      ...valid(),
      contractNumber: ' PPA-1 ',
      capacityValue: 50,
      capacityUnit: 'MW',
      tariffValue: 0.065,
      tariffCurrency: 'USD',
      signedDate: '2026-01-15',
    });
    expect(p).toEqual({
      contractType: 'PURCHASE',
      contractNumber: 'PPA-1',
      projectName: 'Proj',
      projectTypeOrCustomer: 'ໄຟຟ້ານໍ້າຕົກ',
      signedDate: '2026-01-15',
      installedCapacity: '50 MW',
      capacityValue: 50,
      capacityUnit: 'MW',
      tariff: '0.065 USD/kWh',
      tariffValue: 0.065,
      tariffCurrency: 'USD',
      notifyDaysBefore: 60,
    });
  });

  it('keeps explicit installedCapacity/tariff text', () => {
    const p = toPowerContractPayload({
      ...valid(),
      capacityValue: 5,
      installedCapacity: '5 MW net',
      tariffValue: 1,
      tariff: 'custom',
    });
    expect(p.installedCapacity).toBe('5 MW net');
    expect(p.tariff).toBe('custom');
  });

  it('omits capacity and tariff entirely when no values', () => {
    const p = toPowerContractPayload(valid());
    expect('installedCapacity' in p).toBe(false);
    expect('tariff' in p).toBe(false);
    expect('capacityValue' in p).toBe(false);
    expect('capacityUnit' in p).toBe(false);
    expect('tariffCurrency' in p).toBe(false);
  });
});

const existing: PowerContract = {
  id: '1',
  contractType: 'PURCHASE',
  contractNumber: 'N1',
  projectName: 'Proj',
  projectTypeOrCustomer: 'ໄຟຟ້ານໍ້າຕົກ',
  durationText: null,
  durationMonths: null,
  signedDate: '2026-01-15',
  effectiveDate: null,
  expirationDate: null,
  installedCapacity: '50MW (net)',
  capacityValue: 50,
  capacityUnit: 'MW',
  projectLocation: null,
  tariff: null,
  tariffValue: 0.065,
  tariffCurrency: 'USD',
  additionalDetails: null,
  notifyDaysBefore: 60,
  status: 'ACTIVE',
  createdAt: null,
  updatedAt: null,
};

describe('diffPayload', () => {
  it('sends only changed fields', () => {
    const next = toPowerContractPayload({ ...fromPowerContract(existing), projectName: 'New name' });
    expect(diffPayload(next, existing)).toEqual({ projectName: 'New name' });
  });

  it('does not rewrite composed text when value and unit are unchanged', () => {
    const next = toPowerContractPayload(fromPowerContract(existing));
    expect(diffPayload(next, existing)).toEqual({});
  });

  it('recomposes installedCapacity when value changes', () => {
    const next = toPowerContractPayload({ ...fromPowerContract(existing), capacityValue: 60 });
    expect(diffPayload(next, existing)).toEqual({ capacityValue: 60, installedCapacity: '60 MW' });
  });
});
