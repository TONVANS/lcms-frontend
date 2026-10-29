import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';
import {
  CASE_TYPES,
  DISPUTE_STATUSES,
  type CaseType,
  type DisputeStatus,
  type LegalCase,
} from '../types';

const v = lo.legal.validation;

const requiredText = z.string(v.required).trim().min(1, v.required);
const httpUrl = z.url({ protocol: /^https?$/ });

const amount = z
  .number(v.invalid)
  .nullable()
  .refine((n) => n === null || n >= 0, v.amountNonNegative);

/** One schema for the dialog, the wizard and (by shape) CreateLegalCaseDto. */
export const legalCaseFormSchema = z.object(
  {
    caseCode: requiredText.max(100, v.textMax),
    defendant: requiredText.max(300, v.textMax),
    allegation: z.string(v.invalid).trim().max(2000, v.textMax),
    departmentId: z.string(v.invalid),
    departmentAction: z.string(v.invalid).trim().max(2000, v.textMax),
    caseType: z.enum(CASE_TYPES, { message: v.required }),
    disputeStatus: z.enum(DISPUTE_STATUSES, { message: v.required }),
    damageLak: amount,
    damageUsd: amount,
    fineLak: amount,
    fineUsd: amount,
    recoveredLak: amount,
    recoveredUsd: amount,
    date: z
      .string(v.required)
      .trim()
      .min(1, v.required)
      .refine((s) => s === '' || z.iso.date().safeParse(s).success, v.dateInvalid),
    disputeProgress: z.string(v.invalid).max(4000, v.textMax),
    externalUrl: z
      .string(v.invalid)
      .trim()
      .refine((s) => s === '' || httpUrl.safeParse(s).success, v.urlInvalid),
  },
  v.invalid,
);

export interface LegalCaseFormValues {
  caseCode: string;
  defendant: string;
  allegation: string;
  departmentId: string;
  departmentAction: string;
  caseType: CaseType;
  disputeStatus: DisputeStatus;
  damageLak: number | null;
  damageUsd: number | null;
  fineLak: number | null;
  fineUsd: number | null;
  recoveredLak: number | null;
  recoveredUsd: number | null;
  date: string;
  disputeProgress: string;
  externalUrl: string;
}

export function emptyLegalCaseForm(): LegalCaseFormValues {
  return {
    caseCode: '',
    defendant: '',
    allegation: '',
    departmentId: '',
    departmentAction: '',
    caseType: 'CIVIL',
    disputeStatus: 'FIRST_INSTANCE',
    damageLak: null,
    damageUsd: null,
    fineLak: null,
    fineUsd: null,
    recoveredLak: null,
    recoveredUsd: null,
    date: '',
    disputeProgress: '',
    externalUrl: '',
  };
}

export function fromLegalCase(c: LegalCase): LegalCaseFormValues {
  return {
    caseCode: c.caseCode,
    defendant: c.defendant,
    allegation: c.allegation ?? '',
    departmentId: c.departmentId ?? '',
    departmentAction: c.departmentAction ?? '',
    caseType: c.caseType,
    disputeStatus: c.disputeStatus,
    damageLak: c.damageLak,
    damageUsd: c.damageUsd,
    fineLak: c.fineLak,
    fineUsd: c.fineUsd,
    recoveredLak: c.recoveredLak,
    recoveredUsd: c.recoveredUsd,
    date: c.date ?? '',
    disputeProgress: c.disputeProgress ?? '',
    externalUrl: c.externalUrl ?? '',
  };
}
