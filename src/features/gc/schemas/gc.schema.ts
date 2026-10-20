import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';
import {
  GC_CONTRACT_TYPES,
  GC_CURRENCIES,
  type GcEquity,
  type GeneralContract,
} from '../types';

const v = lo.gc.validation;

const requiredText = z.string().trim().min(1, v.required);

const moneySchema = z.object({
  amount: z.number(v.amountPositive).positive(v.amountPositive),
  currency: z.enum(GC_CURRENCIES, { message: v.currency }),
});

const equitySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('percent'),
    percent: z.number(v.percentRange).gt(0, v.percentRange).max(100, v.percentRange),
  }),
  z.object({ kind: z.literal('amount'), money: moneySchema }),
]);

export const gcFormSchema = z
  .object({
    title: requiredText.max(300, v.titleMax),
    type: z.enum(GC_CONTRACT_TYPES, { message: v.required }),
    contractNo: requiredText,
    counterparty: z.string(),
    termText: z.string(),
    signedDate: requiredText,
    effectiveDate: requiredText,
    endDate: z.string().nullable(),
    value: moneySchema.nullable(),
    equity: equitySchema.nullable(),
    implementer: z.string(),
    notes: z.string().max(2000, v.notesMax),
  })
  .superRefine((val, ctx) => {
    if (val.endDate && val.effectiveDate && val.endDate <= val.effectiveDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: v.endAfterEffective });
    }
  });

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
    endDate: f.endDate ? f.endDate : null,
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
