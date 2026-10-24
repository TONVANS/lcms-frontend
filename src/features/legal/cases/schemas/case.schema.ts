import { format } from 'date-fns';
import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';
import {
  CASE_STAGES,
  CASE_TYPES,
  type CaseInput,
  type CaseStage,
  type CaseType,
  type DualAmount,
  type LegalCase,
} from '../types';

const v = lo.legal.validation;

const isIsoDate = (s: string): boolean => z.iso.date().safeParse(s).success;

const requiredText = z.string(v.required).trim().min(1, v.required);

const amountSide = z
  .number()
  .nullable()
  .refine((n) => n === null || n >= 0, v.amountNonNegative);

const dualAmountSchema = z.object({
  lak: amountSide,
  usd: amountSide,
});

const disputeDateField = z
  .string()
  .nullable()
  .refine((s) => {
    if (s === null || s.trim() === '') return true;
    return isIsoDate(s.trim());
  }, v.dateInvalid)
  .refine((s) => {
    if (s === null || s.trim() === '') return true;
    const t = s.trim();
    if (!isIsoDate(t)) return true; // Let dateInvalid handle malformed dates
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return t <= todayStr;
  }, v.disputeDateFuture);

export const caseFormSchema = z.object(
  {
    defendant: requiredText.max(200, v.textMax),
    allegation: requiredText.max(300, v.textMax),
    handlingUnit: requiredText.max(200, v.textMax),
    caseType: z.enum(CASE_TYPES, { message: v.required }),
    stage: z.enum(CASE_STAGES, { message: v.required }),
    damage: dualAmountSchema,
    fine: dualAmountSchema,
    recovered: dualAmountSchema,
    disputeDate: disputeDateField,
    progress: z.string(v.invalid).max(2000, v.textMax),
  },
  v.invalid,
);

export type CaseFormValues = {
  defendant: string;
  allegation: string;
  handlingUnit: string;
  caseType: CaseType;
  stage: CaseStage;
  damage: DualAmount;
  fine: DualAmount;
  recovered: DualAmount;
  disputeDate: string | null;
  progress: string;
};

export function emptyCaseForm(): CaseFormValues {
  return {
    defendant: '',
    allegation: '',
    handlingUnit: '',
    caseType: 'civil',
    stage: 'first_instance',
    damage: { lak: null, usd: null },
    fine: { lak: null, usd: null },
    recovered: { lak: null, usd: null },
    disputeDate: null,
    progress: '',
  };
}

const orNull = (s: string | null): string | null => {
  if (s === null) return null;
  const t = s.trim();
  return t === '' ? null : t;
};

export function toCasePayload(f: CaseFormValues): CaseInput {
  return {
    defendant: f.defendant.trim(),
    allegation: f.allegation.trim(),
    handlingUnit: f.handlingUnit.trim(),
    caseType: f.caseType,
    stage: f.stage,
    damage: { lak: f.damage.lak, usd: f.damage.usd },
    fine: { lak: f.fine.lak, usd: f.fine.usd },
    recovered: { lak: f.recovered.lak, usd: f.recovered.usd },
    disputeDate: orNull(f.disputeDate),
    progress: orNull(f.progress),
  };
}

export function fromCase(c: LegalCase): CaseFormValues {
  return {
    defendant: c.defendant,
    allegation: c.allegation,
    handlingUnit: c.handlingUnit,
    caseType: c.caseType,
    stage: c.stage,
    damage: { lak: c.damage.lak, usd: c.damage.usd },
    fine: { lak: c.fine.lak, usd: c.fine.usd },
    recovered: { lak: c.recovered.lak, usd: c.recovered.usd },
    disputeDate: c.disputeDate,
    progress: c.progress ?? '',
  };
}
