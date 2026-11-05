import { describe, expect, it } from 'vitest';
import { diffPayload, toContractPayload } from '../lib/contract-mapper';
import type { Contract } from '../types';
import { emptyGcForm, fromContract, gcFormSchema, type GcFormValues } from './gc.schema';

describe('GC Schema and Payload Generation', () => {
  it('correctly validates valid contract form values', () => {
    const gcForm: GcFormValues = {
      title: 'ສັນຍາຈ້າງເໝົາບຳລຸງຮັກສາ (O&M)',
      contractTypeId: 1,
      contractNumber: 'EDL-CON-2026/001',
      status: 'DRAFT',
      durationText: '5 ປີ',
      durationMonths: 60,
      signedDate: '2026-01-10',
      effectiveDate: '2026-02-01',
      expirationDate: '2031-02-01',
      contractValue: 1500000,
      currency: 'USD',
      equityOrCapitalContribution: '51%',
      sharePercentage: 51.0,
      implementer: 'ຝ່າຍວິສະວະກຳ',
      additionalDetails: 'ໝາຍເຫ端ເພີ່ມເຕີມ',
      notifyDaysBefore: 60,
    };

    const parsed = gcFormSchema.safeParse(gcForm);
    expect(parsed.success).toBe(true);

    const payload = toContractPayload(gcForm);
    expect(payload.title).toBe('ສັນຍາຈ້າງເໝົາບຳລຸງຮັກສາ (O&M)');
    expect(payload.contractTypeId).toBe(1);
    expect(payload.contractNumber).toBe('EDL-CON-2026/001');
    expect(payload.status).toBe('DRAFT');
    expect(payload.durationMonths).toBe(60);
    expect(payload.contractValue).toBe(1500000);
    expect(payload.currency).toBe('USD');
  });

  it('defaults status to DRAFT and allows selecting another status on create', () => {
    const newForm = emptyGcForm();
    expect(newForm.status).toBe('DRAFT');
    newForm.title = 'ສັນຍາໃໝ່';
    newForm.contractTypeId = 2;
    newForm.contractNumber = 'EDL-2026-999';

    const defaultPayload = toContractPayload(newForm);
    expect(defaultPayload.status).toBe('DRAFT');

    newForm.status = 'ACTIVE';
    const activePayload = toContractPayload(newForm);
    expect(activePayload.status).toBe('ACTIVE');
  });

  it('correctly maps status in fromContract and sends status in diffPayload when edited', () => {
    const existingContract: Contract = {
      id: 'gc-001',
      title: 'ສັນຍາຈ້າງເໝົາບຳລຸງຮັກສາ (O&M)',
      contractTypeId: 1,
      contractType: { id: 1, nameLo: 'ສັນຍາທົ່ວໄປ', nameEn: 'General' },
      contractNumber: 'EDL-CON-2026/001',
      durationText: '5 ປີ',
      durationMonths: 60,
      signedDate: '2026-01-10',
      effectiveDate: '2026-02-01',
      expirationDate: '2031-02-01',
      contractValue: 1500000,
      currency: 'USD',
      equityOrCapitalContribution: '51%',
      sharePercentage: 51.0,
      implementer: 'ຝ່າຍວິສະວະກຳ',
      additionalDetails: 'ໝາຍເຫດເພີ່ມເຕີມ',
      notifyDaysBefore: 60,
      status: 'DRAFT',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const formValues = fromContract(existingContract);
    expect(formValues.status).toBe('DRAFT');

    // Unchanged status produces no status diff
    const unchangedPayload = toContractPayload(formValues);
    const unchangedDiff = diffPayload(existingContract, unchangedPayload);
    expect(unchangedDiff.status).toBeUndefined();

    // Changed status to ACTIVE produces status in diff
    formValues.status = 'ACTIVE';
    const updatedPayload = toContractPayload(formValues);
    expect(updatedPayload.status).toBe('ACTIVE');

    const patch = diffPayload(existingContract, updatedPayload);
    expect(patch.status).toBe('ACTIVE');
  });

  it('rejects expirationDate earlier than effectiveDate', () => {
    const form = emptyGcForm();
    form.title = 'ສັນຍາ';
    form.contractTypeId = 1;
    form.contractNumber = 'CON-01';
    form.effectiveDate = '2026-02-01';
    form.expirationDate = '2025-02-01';

    const result = gcFormSchema.safeParse(form);
    expect(result.success).toBe(false);
  });
});
