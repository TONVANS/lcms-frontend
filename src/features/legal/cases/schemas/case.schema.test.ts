import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import type { LegalCase } from '../types';
import {
  caseFormSchema,
  emptyCaseForm,
  fromCase,
  toCasePayload,
  type CaseFormValues,
} from './case.schema';

const v = lo.legal.validation;

const base: CaseFormValues = {
  ...emptyCaseForm(),
  defendant: 'ທ້າວ ສົມສັກ',
  allegation: 'ລັກສາຍໄຟຟ້າ',
  handlingUnit: 'ສານປະຊາຊົນນະຄອນຫຼວງ',
};

function messages(input: unknown): Map<string, string> {
  const r = caseFormSchema.safeParse(input);
  const m = new Map<string, string>();
  if (!r.success) {
    for (const i of r.error.issues) {
      if (!m.has(i.path.join('.'))) m.set(i.path.join('.'), i.message);
    }
  }
  return m;
}

const ok = (input: unknown) => caseFormSchema.safeParse(input).success;

describe('caseFormSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a minimal valid form', () => {
    expect(ok(base)).toBe(true);
  });

  it('requires defendant, allegation, handlingUnit', () => {
    expect(messages({ ...base, defendant: '' }).get('defendant')).toBe(v.required);
    expect(messages({ ...base, defendant: '   ' }).get('defendant')).toBe(v.required);
    expect(messages({ ...base, allegation: '' }).get('allegation')).toBe(v.required);
    expect(messages({ ...base, allegation: '   ' }).get('allegation')).toBe(v.required);
    expect(messages({ ...base, handlingUnit: '' }).get('handlingUnit')).toBe(v.required);
    expect(messages({ ...base, handlingUnit: '   ' }).get('handlingUnit')).toBe(v.required);
  });

  it('length limits 200/300/200 and progress 2000', () => {
    expect(ok({ ...base, defendant: 'a'.repeat(200) })).toBe(true);
    expect(messages({ ...base, defendant: 'a'.repeat(201) }).get('defendant')).toBe(v.textMax);

    expect(ok({ ...base, allegation: 'a'.repeat(300) })).toBe(true);
    expect(messages({ ...base, allegation: 'a'.repeat(301) }).get('allegation')).toBe(v.textMax);

    expect(ok({ ...base, handlingUnit: 'a'.repeat(200) })).toBe(true);
    expect(messages({ ...base, handlingUnit: 'a'.repeat(201) }).get('handlingUnit')).toBe(v.textMax);

    expect(ok({ ...base, progress: 'a'.repeat(2000) })).toBe(true);
    expect(messages({ ...base, progress: 'a'.repeat(2001) }).get('progress')).toBe(v.textMax);
  });

  it('amounts must be >= 0 or null', () => {
    expect(
      messages({
        ...base,
        damage: { lak: -1, usd: null },
      }).get('damage.lak'),
    ).toBe(v.amountNonNegative);

    expect(
      messages({
        ...base,
        fine: { lak: null, usd: -0.5 },
      }).get('fine.usd'),
    ).toBe(v.amountNonNegative);

    expect(
      messages({
        ...base,
        recovered: { lak: -100, usd: null },
      }).get('recovered.lak'),
    ).toBe(v.amountNonNegative);

    expect(
      ok({
        ...base,
        damage: { lak: 0, usd: 0 },
        fine: { lak: null, usd: 0 },
        recovered: { lak: 0, usd: null },
      }),
    ).toBe(true);
  });

  it('disputeDate may be null; must be a real date; must not be after today', () => {
    expect(ok({ ...base, disputeDate: null })).toBe(true);
    expect(ok({ ...base, disputeDate: '' })).toBe(true);
    expect(ok({ ...base, disputeDate: '2026-10-24' })).toBe(true);
    expect(ok({ ...base, disputeDate: '2026-05-10' })).toBe(true);

    expect(messages({ ...base, disputeDate: '2026-10-25' }).get('disputeDate')).toBe(
      v.disputeDateFuture,
    );
    expect(messages({ ...base, disputeDate: 'not-a-date' }).get('disputeDate')).toBe(v.dateInvalid);
    expect(messages({ ...base, disputeDate: '2026-02-30' }).get('disputeDate')).toBe(v.dateInvalid);
  });

  it('round-trip toCasePayload/fromCase', () => {
    const form: CaseFormValues = {
      defendant: '  ທ້າວ ບຸນມີ  ',
      allegation: '  ລັກສາຍໄຟ  ',
      handlingUnit: '  ສານເຂດ 1  ',
      caseType: 'criminal',
      stage: 'appeal',
      damage: { lak: 15000000, usd: 1000 },
      fine: { lak: 2000000, usd: null },
      recovered: { lak: 5000000, usd: null },
      disputeDate: '2026-06-15',
      progress: '  ກຳລັງດຳເນີນ  ',
    };

    const payload = toCasePayload(form);
    expect(payload).toEqual({
      defendant: 'ທ້າວ ບຸນມີ',
      allegation: 'ລັກສາຍໄຟ',
      handlingUnit: 'ສານເຂດ 1',
      caseType: 'criminal',
      stage: 'appeal',
      damage: { lak: 15000000, usd: 1000 },
      fine: { lak: 2000000, usd: null },
      recovered: { lak: 5000000, usd: null },
      disputeDate: '2026-06-15',
      progress: 'ກຳລັງດຳເນີນ',
    });

    const c: LegalCase = {
      id: 'case-99',
      caseNo: 'LC-2026-099',
      ...payload,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      createdBy: 'admin',
    };

    const backToForm = fromCase(c);
    expect(backToForm.defendant).toBe('ທ້າວ ບຸນມີ');
    expect(backToForm.caseType).toBe('criminal');
    expect(backToForm.stage).toBe('appeal');
    expect(backToForm.damage).toEqual({ lak: 15000000, usd: 1000 });
    expect(backToForm.progress).toBe('ກຳລັງດຳເນີນ');
  });
});
