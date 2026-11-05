import { describe, expect, it } from 'vitest';
import {
  calculateMonthsDiff,
  durationTextToMonths,
  monthsToDurationText,
} from '../lib/format';
import type { PowerContract } from '../types';
import {
  diffPayload,
  emptyPowerForm,
  fromPowerContract,
  powerContractSchema,
  toPowerContractPayload,
  type PowerFormValues,
} from './ppa.schema';

describe('PPA & PSA Schema and Payload Generation', () => {
  it('correctly builds POST /power-contracts payload for PPA (Purchase Contract)', () => {
    const ppaForm: PowerFormValues = {
      contractType: 'PURCHASE',
      contractNumber: 'PPA-2026-001',
      projectName: 'ໂຄງການເຂື່ອນໄຟຟ້ານ້ຳອູ 1',
      projectTypeOrCustomer: 'ໄຟຟ້ານໍ້າຕົກ',
      status: 'DRAFT',
      durationText: '25 ປີ',
      durationMonths: 300,
      signedDate: '2026-01-15',
      effectiveDate: '2026-02-01',
      expirationDate: '2051-02-01',
      installedCapacity: '',
      capacityValue: 50.0,
      capacityUnit: 'MW',
      projectLocation: 'ແຂວງຜົ້ງສາລີ',
      tariff: '',
      tariffValue: 0.065,
      tariffCurrency: 'USD',
      additionalDetails: 'ໄລຍະກໍ່ສ້າງ 3 ປີ',
      notifyDaysBefore: 60,
    };

    const parsed = powerContractSchema.safeParse(ppaForm);
    expect(parsed.success).toBe(true);

    const payload = toPowerContractPayload(ppaForm);
    expect(payload).toEqual({
      contractType: 'PURCHASE',
      contractNumber: 'PPA-2026-001',
      projectName: 'ໂຄງການເຂື່ອນໄຟຟ້ານ້ຳອູ 1',
      projectTypeOrCustomer: 'ໄຟຟ້ານໍ້າຕົກ',
      status: 'DRAFT',
      durationText: '25 ປີ',
      durationMonths: 300,
      signedDate: '2026-01-15',
      effectiveDate: '2026-02-01',
      expirationDate: '2051-02-01',
      installedCapacity: '50 MW',
      capacityValue: 50.0,
      capacityUnit: 'MW',
      projectLocation: 'ແຂວງຜົ້ງສາລີ',
      tariff: '0.065 USD/kWh',
      tariffValue: 0.065,
      tariffCurrency: 'USD',
      additionalDetails: 'ໄລຍະກໍ່ສ້າງ 3 ປີ',
      notifyDaysBefore: 60,
    });
  });

  it('correctly builds POST /power-contracts payload for PSA (Sale Contract)', () => {
    const psaForm: PowerFormValues = {
      contractType: 'SALE',
      contractNumber: 'PSA-2026-001',
      projectName: 'ສັນຍາຂາຍໄຟຟ້າໃຫ້ໂຮງງານຊີມັງລາວ',
      projectTypeOrCustomer: 'ບໍລິສັດ ຊີມັງລາວ ຈຳກັດ',
      status: 'ACTIVE',
      durationText: '10 ປີ',
      durationMonths: 120,
      signedDate: '2026-03-01',
      effectiveDate: '2026-04-01',
      expirationDate: '2036-04-01',
      installedCapacity: '',
      capacityValue: 15.0,
      capacityUnit: 'MW',
      projectLocation: 'ແຂວງວຽງຈັນ',
      tariff: '',
      tariffValue: 850,
      tariffCurrency: 'LAK',
      additionalDetails: 'ສັນຍາຂາຍໄຟຟ້າແຮງດັນກາງ',
      notifyDaysBefore: 60,
    };

    const parsed = powerContractSchema.safeParse(psaForm);
    expect(parsed.success).toBe(true);

    const payload = toPowerContractPayload(psaForm);
    expect(payload).toEqual({
      contractType: 'SALE',
      contractNumber: 'PSA-2026-001',
      projectName: 'ສັນຍາຂາຍໄຟຟ້າໃຫ້ໂຮງງານຊີມັງລາວ',
      projectTypeOrCustomer: 'ບໍລິສັດ ຊີມັງລາວ ຈຳກັດ',
      status: 'ACTIVE',
      durationText: '10 ປີ',
      durationMonths: 120,
      signedDate: '2026-03-01',
      effectiveDate: '2026-04-01',
      expirationDate: '2036-04-01',
      installedCapacity: '15 MW',
      capacityValue: 15.0,
      capacityUnit: 'MW',
      projectLocation: 'ແຂວງວຽງຈັນ',
      tariff: '850 LAK/kWh',
      tariffValue: 850,
      tariffCurrency: 'LAK',
      additionalDetails: 'ສັນຍາຂາຍໄຟຟ້າແຮງດັນກາງ',
      notifyDaysBefore: 60,
    });
  });

  it('sets appropriate default currency and status in emptyPowerForm', () => {
    const purchaseDefaults = emptyPowerForm('PURCHASE');
    expect(purchaseDefaults.contractType).toBe('PURCHASE');
    expect(purchaseDefaults.tariffCurrency).toBe('USD');
    expect(purchaseDefaults.capacityUnit).toBe('MW');
    expect(purchaseDefaults.notifyDaysBefore).toBe(60);
    expect(purchaseDefaults.status).toBe('DRAFT');

    const saleDefaults = emptyPowerForm('SALE');
    expect(saleDefaults.contractType).toBe('SALE');
    expect(saleDefaults.tariffCurrency).toBe('LAK');
    expect(saleDefaults.capacityUnit).toBe('MW');
    expect(saleDefaults.notifyDaysBefore).toBe(60);
    expect(saleDefaults.status).toBe('DRAFT');
  });

  it('auto-computes durationText from durationMonths and vice versa', () => {
    expect(monthsToDurationText(300)).toBe('25 ປີ');
    expect(monthsToDurationText(120)).toBe('10 ປີ');
    expect(monthsToDurationText(18)).toBe('1 ປີ 6 ເດືອນ');
    expect(monthsToDurationText(6)).toBe('6 ເດືອນ');

    expect(durationTextToMonths('25 ປີ')).toBe(300);
    expect(durationTextToMonths('10 ປີ')).toBe(120);
    expect(durationTextToMonths('1 ປີ 6 ເດືອນ')).toBe(18);
    expect(durationTextToMonths('6 ເດືອນ')).toBe(6);

    expect(calculateMonthsDiff('2026-02-01', '2051-02-01')).toBe(300);
    expect(calculateMonthsDiff('2026-04-01', '2036-04-01')).toBe(120);
  });

  it('auto-generates missing duration text when durationMonths is given in payload builder', () => {
    const form = emptyPowerForm('PURCHASE');
    form.projectName = 'ໂຄງການເຂື່ອນ';
    form.projectTypeOrCustomer = 'ໄຟຟ້ານໍ້າຕົກ';
    form.durationMonths = 300;
    form.durationText = '';

    const payload = toPowerContractPayload(form);
    expect(payload.durationMonths).toBe(300);
    expect(payload.durationText).toBe('25 ປີ');
    expect(payload.status).toBe('DRAFT');
  });

  it('auto-generates durationMonths when durationText is given in payload builder', () => {
    const form = emptyPowerForm('SALE');
    form.projectName = 'ສັນຍາຂາຍໄຟຟ້າ';
    form.projectTypeOrCustomer = 'ໂຮງງານຊີມັງ';
    form.durationText = '10 ປີ';
    form.durationMonths = null;

    const payload = toPowerContractPayload(form);
    expect(payload.durationMonths).toBe(120);
    expect(payload.durationText).toBe('10 ປີ');
    expect(payload.status).toBe('DRAFT');
  });

  it('rejects expirationDate earlier than effectiveDate', () => {
    const form = emptyPowerForm('PURCHASE');
    form.projectName = 'ໂຄງການເຂື່ອນ';
    form.projectTypeOrCustomer = 'ໄຟຟ້ານໍ້າຕົກ';
    form.effectiveDate = '2026-02-01';
    form.expirationDate = '2025-02-01';

    const result = powerContractSchema.safeParse(form);
    expect(result.success).toBe(false);
  });

  it('correctly maps status in fromPowerContract and sends status in diffPayload when edited', () => {
    const existingContract: PowerContract = {
      id: 'ppa-123',
      contractType: 'PURCHASE',
      contractNumber: 'PPA-2026-001',
      projectName: 'ໂຄງການເຂື່ອນໄຟຟ້ານ້ຳອູ 1',
      projectTypeOrCustomer: 'ໄຟຟ້ານໍ້າຕົກ',
      durationText: '25 ປີ',
      durationMonths: 300,
      signedDate: '2026-01-15',
      effectiveDate: '2026-02-01',
      expirationDate: '2051-02-01',
      installedCapacity: '50 MW',
      capacityValue: 50.0,
      capacityUnit: 'MW',
      projectLocation: 'ແຂວງຜົ້ງສາລີ',
      tariff: '0.065 USD/kWh',
      tariffValue: 0.065,
      tariffCurrency: 'USD',
      additionalDetails: 'ໝາຍເຫດ',
      notifyDaysBefore: 60,
      status: 'DRAFT',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const formValues = fromPowerContract(existingContract);
    expect(formValues.status).toBe('DRAFT');

    // When status is unchanged, diffPayload does not include status
    const unchangedPayload = toPowerContractPayload(formValues);
    const unchangedDiff = diffPayload(unchangedPayload, existingContract);
    expect(unchangedDiff.status).toBeUndefined();

    // When user changes status to ACTIVE, diffPayload includes status
    formValues.status = 'ACTIVE';
    const updatedPayload = toPowerContractPayload(formValues);
    expect(updatedPayload.status).toBe('ACTIVE');

    const patch = diffPayload(updatedPayload, existingContract);
    expect(patch.status).toBe('ACTIVE');
  });
});
