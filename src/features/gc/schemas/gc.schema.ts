import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';
import { GC_DEFAULT_NOTIFY_DAYS, type Contract } from '../types';

const v = lo.gc.validation;

const isIsoDate = (s: string): boolean => z.iso.date().safeParse(s).success;

const requiredText = (max: number, maxMsg: string) =>
  z.string(v.required).trim().min(1, v.required).max(max, maxMsg);
const optionalText = (max: number, maxMsg: string) => z.string(v.invalid).max(max, maxMsg);

/** Optional YYYY-MM-DD; '' means not set. */
const optionalDate = z
  .string(v.dateInvalid)
  .trim()
  .refine((s) => s === '' || isIsoDate(s), v.dateInvalid);

const optionalInt = z.number(v.invalid).int(v.integer).min(0, v.nonNegative).nullable();

/**
 * Form schema = CreateContractDto. Required: title, contractTypeId, contractNumber.
 * Empty optional text/dates are '' and optional numbers are null; the payload mapper drops them.
 */
export const gcFormSchema = z
  .object(
    {
      title: requiredText(300, v.titleMax),
      contractTypeId: z.number(v.required).int(v.required).positive(v.required),
      contractNumber: requiredText(100, v.invalid),
      durationText: optionalText(100, v.invalid),
      durationMonths: optionalInt,
      signedDate: optionalDate,
      effectiveDate: optionalDate,
      expirationDate: optionalDate,
      contractValue: z.number(v.invalid).min(0, v.nonNegative).nullable(),
      currency: z.enum(['LAK', 'USD', 'CNY'], { message: v.currency }).nullable(),
      equityOrCapitalContribution: optionalText(200, v.invalid),
      sharePercentage: z.number(v.percentRange).min(0, v.percentRange).max(100, v.percentRange).nullable(),
      implementer: optionalText(200, v.invalid),
      additionalDetails: optionalText(2000, v.notesMax),
      notifyDaysBefore: z.number(v.invalid).int(v.integer).min(0, v.nonNegative),
    },
    v.invalid,
  )
  // `when` keeps this check running even when other fields have issues.
  .refine(
    (val) => {
      const eff = typeof val.effectiveDate === 'string' ? val.effectiveDate.trim() : '';
      const exp = typeof val.expirationDate === 'string' ? val.expirationDate.trim() : '';
      if (!eff || !exp || !isIsoDate(eff) || !isIsoDate(exp)) return true;
      return exp >= eff;
    },
    { path: ['expirationDate'], message: v.endAfterEffective, when: () => true },
  );

export type GcFormValues = z.infer<typeof gcFormSchema>;

export function emptyGcForm(): GcFormValues {
  return {
    title: '',
    contractTypeId: null as unknown as number,
    contractNumber: '',
    durationText: '',
    durationMonths: null,
    signedDate: '',
    effectiveDate: '',
    expirationDate: '',
    contractValue: null,
    currency: null,
    equityOrCapitalContribution: '',
    sharePercentage: null,
    implementer: '',
    additionalDetails: '',
    notifyDaysBefore: GC_DEFAULT_NOTIFY_DAYS,
  };
}

export function fromContract(c: Contract): GcFormValues {
  return {
    title: c.title,
    contractTypeId: c.contractTypeId as number,
    contractNumber: c.contractNumber,
    durationText: c.durationText ?? '',
    durationMonths: c.durationMonths,
    signedDate: c.signedDate ?? '',
    effectiveDate: c.effectiveDate ?? '',
    expirationDate: c.expirationDate ?? '',
    contractValue: c.contractValue,
    currency: c.currency,
    equityOrCapitalContribution: c.equityOrCapitalContribution ?? '',
    sharePercentage: c.sharePercentage,
    implementer: c.implementer ?? '',
    additionalDetails: c.additionalDetails ?? '',
    notifyDaysBefore: c.notifyDaysBefore ?? GC_DEFAULT_NOTIFY_DAYS,
  };
}
