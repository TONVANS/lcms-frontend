import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';
import { DOC_STATUSES, DOC_TYPES, type DocStatus, type DocType, type LegalDocument } from '../types';

const v = lo.legal.validation;

const requiredText = z.string(v.required).trim().min(1, v.required);
const optionalText = (max: number, message: string = v.textMax) =>
  z.string(v.invalid).trim().max(max, message);

const httpUrl = z.url({ protocol: /^https?$/ });

/** Kept as a string while editing; an integer between 1900 and 2100 once submitted. */
const yearField = z
  .string(v.required)
  .trim()
  .min(1, v.required)
  .refine((s) => {
    if (!/^\d{4}$/.test(s)) return false;
    const n = Number(s);
    return n >= 1900 && n <= 2100;
  }, v.yearRange);

/** One schema for the dialog, the wizard and (by shape) CreateLegalDocumentDto. */
export const legalDocumentFormSchema = z.object(
  {
    docTitle: requiredText.max(300, v.titleMax),
    docType: z.enum(DOC_TYPES, { message: v.required }),
    issueYear: yearField,
    docNumberDate: requiredText.max(300, v.textMax),
    status: z.enum(DOC_STATUSES, { message: v.required }),
    responsiblePerson: optionalText(200),
    departmentId: requiredText,
    purpose: z.string(v.invalid).max(2000, v.purposeMax),
    externalUrl: z
      .string(v.invalid)
      .trim()
      .refine((s) => s === '' || httpUrl.safeParse(s).success, v.urlInvalid),
  },
  v.invalid,
);

export interface LegalDocumentFormValues {
  docTitle: string;
  docType: DocType;
  issueYear: string;
  docNumberDate: string;
  status: DocStatus;
  responsiblePerson: string;
  departmentId: string;
  purpose: string;
  externalUrl: string;
}

export function emptyLegalDocumentForm(): LegalDocumentFormValues {
  return {
    docTitle: '',
    docType: 'REGULATION',
    issueYear: String(new Date().getFullYear()),
    docNumberDate: '',
    status: 'ACTIVE',
    responsiblePerson: '',
    departmentId: '',
    purpose: '',
    externalUrl: '',
  };
}

export function fromLegalDocument(d: LegalDocument): LegalDocumentFormValues {
  return {
    docTitle: d.docTitle,
    docType: d.docType,
    issueYear: d.issueYear === null ? '' : String(d.issueYear),
    docNumberDate: d.docNumberDate,
    status: d.status,
    responsiblePerson: d.responsiblePerson ?? '',
    departmentId: d.departmentId ?? '',
    purpose: d.purpose ?? '',
    externalUrl: d.externalUrl ?? '',
  };
}
