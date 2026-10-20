import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';
import {
  GC_CONTRACT_TYPES,
  GC_CURRENCIES,
  type GcEquity,
  type GeneralContract,
} from '../types';

const v = lo.gc.validation;

const isIsoDate = (s: string): boolean => z.iso.date().safeParse(s).success;

const requiredText = z.string(v.required).trim().min(1, v.required);
const optionalText = z.string(v.invalid);

/** Required YYYY-MM-DD. Empty reads "required"; anything else must be a real calendar date. */
const requiredDate = z
  .string(v.required)
  .trim()
  .min(1, v.required)
  .refine((s) => s === '' || isIsoDate(s), v.dateInvalid);

/** Optional YYYY-MM-DD. null or blank means open-ended. */
const optionalDate = z
  .string(v.dateInvalid)
  .trim()
  .refine((s) => s === '' || isIsoDate(s), v.dateInvalid)
  .nullable();

const moneySchema = z.object(
  {
    amount: z.number(v.amountPositive).positive(v.amountPositive),
    currency: z.enum(GC_CURRENCIES, { message: v.currency }),
  },
  v.invalid,
);

const equitySchema = z.discriminatedUnion(
  'kind',
  [
    z.object(
      {
        kind: z.literal('percent'),
        percent: z.number(v.percentRange).gt(0, v.percentRange).max(100, v.percentRange),
      },
      v.invalid,
    ),
    z.object({ kind: z.literal('amount'), money: moneySchema }, v.invalid),
  ],
  { error: v.invalid },
);

export const gcFormSchema = z
  .object(
    {
      title: requiredText.max(300, v.titleMax),
      type: z.enum(GC_CONTRACT_TYPES, { message: v.required }),
      contractNo: requiredText,
      counterparty: optionalText,
      termText: optionalText,
      signedDate: requiredDate,
      effectiveDate: requiredDate,
      endDate: optionalDate,
      value: moneySchema.nullable(),
      equity: equitySchema.nullable(),
      implementer: optionalText,
      notes: z.string(v.invalid).max(2000, v.notesMax),
    },
    v.invalid,
  )
  // `when` keeps this check running even when other fields have issues, so the order error
  // is never hidden behind an unrelated one. Malformed dates are reported on their own field.
  .refine(
    (val) => {
      const end = typeof val.endDate === 'string' ? val.endDate.trim() : '';
      const eff = typeof val.effectiveDate === 'string' ? val.effectiveDate.trim() : '';
      if (!end || !isIsoDate(end) || !isIsoDate(eff)) return true;
      return end > eff;
    },
    { path: ['endDate'], message: v.endAfterEffective, when: () => true },
  );

export type GcFormValues = z.infer<typeof gcFormSchema>;

export type GcContractInput = Omit<GeneralContract, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

export function emptyGcForm(): GcFormValues {
  return {
    title: '',
    type: 'om_service',
    contractNo: '',
    counterparty: '',
    termText: '',
    signedDate: '',
    effectiveDate: '',
    endDate: null,
    value: null,
    equity: null,
    implementer: '',
    notes: '',
  };
}

const orNull = (s: string): string | null => {
  const t = s.trim();
  return t === '' ? null : t;
};

export function toGcPayload(f: GcFormValues): GcContractInput {
  return {
    title: f.title.trim(),
    type: f.type,
    contractNo: f.contractNo.trim(),
    counterparty: orNull(f.counterparty),
    termText: orNull(f.termText),
    signedDate: f.signedDate,
    effectiveDate: f.effectiveDate,
    endDate: f.endDate === null ? null : orNull(f.endDate),
    value: f.value,
    equity: f.equity as GcEquity | null,
    implementer: orNull(f.implementer),
    notes: orNull(f.notes),
  };
}

export function fromGcContract(c: GeneralContract): GcFormValues {
  return {
    title: c.title,
    type: c.type,
    contractNo: c.contractNo,
    counterparty: c.counterparty ?? '',
    termText: c.termText ?? '',
    signedDate: c.signedDate,
    effectiveDate: c.effectiveDate,
    endDate: c.endDate,
    value: c.value as GcFormValues['value'],
    equity: c.equity as GcFormValues['equity'],
    implementer: c.implementer ?? '',
    notes: c.notes ?? '',
  };
}
