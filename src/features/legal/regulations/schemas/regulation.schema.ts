import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';
import { LEGAL_UNITS } from '../../constants';
import {
  REGULATION_STATUSES,
  REGULATION_TYPES,
  type Regulation,
} from '../types';

const v = lo.legal.validation;

const MAX_LINKS = 10;
const YEAR_MIN = 1975;
const YEAR_MAX = 2100;

const isIsoDate = (s: string): boolean => z.iso.date().safeParse(s).success;
const httpsUrl = z.url({ protocol: /^https$/ });
const isHttpsUrl = (s: string): boolean => httpsUrl.safeParse(s).success;

const requiredText = z.string(v.required).trim().min(1, v.required);

/** Required YYYY-MM-DD. Empty reads "required"; anything else must be a real calendar date. */
const requiredDate = z
  .string(v.required)
  .trim()
  .min(1, v.required)
  .refine((s) => s === '' || isIsoDate(s), v.dateInvalid);

/** '' or a 4-digit year within range. Kept as a string while editing. */
const yearField = z
  .string(v.yearRange)
  .trim()
  .refine((s) => {
    if (s === '') return true;
    if (!/^\d{4}$/.test(s)) return false;
    const n = Number(s);
    return n >= YEAR_MIN && n <= YEAR_MAX;
  }, v.yearRange);

/**
 * The form may hold blank rows while the user edits. Blank entries are ignored here (and dropped
 * by `toRegulationPayload`); only non-blank entries must be https URLs and count toward the cap.
 */
const linksField = z.array(z.string(v.urlInvalid), v.invalid).superRefine((links, ctx) => {
  let count = 0;
  links.forEach((raw, i) => {
    const s = raw.trim();
    if (s === '') return;
    count += 1;
    if (!isHttpsUrl(s)) ctx.addIssue({ code: 'custom', path: [i], message: v.urlInvalid });
  });
  if (count > MAX_LINKS) ctx.addIssue({ code: 'custom', message: v.linksMax });
});

export const regulationFormSchema = z
  .object(
    {
      title: requiredText.max(300, v.titleMax),
      type: z.enum(REGULATION_TYPES, { message: v.required }),
      typeOther: z.string(v.invalid).trim().max(100, v.textMax),
      number: requiredText.max(100, v.textMax),
      issuedDate: requiredDate,
      year: yearField,
      purpose: z.string(v.invalid).max(2000, v.purposeMax),
      responsible: z.string(v.invalid).trim().max(200, v.textMax),
      unit: z.enum(LEGAL_UNITS, { message: v.required }),
      status: z.enum(REGULATION_STATUSES, { message: v.required }),
      externalLinks: linksField,
    },
    v.invalid,
  )
  // `when` keeps this check running even when other fields have issues.
  .refine((val) => val.type !== 'other' || (typeof val.typeOther === 'string' && val.typeOther.trim() !== ''), {
    path: ['typeOther'],
    message: v.typeOtherRequired,
    when: () => true,
  });

export type RegulationFormValues = {
  title: string;
  type: (typeof REGULATION_TYPES)[number];
  typeOther: string;
  number: string;
  issuedDate: string;
  year: string;
  purpose: string;
  responsible: string;
  unit: (typeof LEGAL_UNITS)[number];
  status: (typeof REGULATION_STATUSES)[number];
  externalLinks: string[];
};

export type RegulationInput = Omit<Regulation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

export function emptyRegulationForm(): RegulationFormValues {
  return {
    title: '',
    type: 'decision',
    typeOther: '',
    number: '',
    issuedDate: '',
    year: '',
    purpose: '',
    responsible: '',
    unit: 'edl_office',
    status: 'in_force',
    externalLinks: [],
  };
}

const orNull = (s: string): string | null => {
  const t = s.trim();
  return t === '' ? null : t;
};

export function toRegulationPayload(f: RegulationFormValues): RegulationInput {
  const year = f.year.trim();
  return {
    title: f.title.trim(),
    type: f.type,
    typeOther: f.type === 'other' ? orNull(f.typeOther) : null,
    number: f.number.trim(),
    issuedDate: f.issuedDate,
    year: year === '' ? null : Number(year),
    purpose: orNull(f.purpose),
    responsible: orNull(f.responsible),
    unit: f.unit,
    status: f.status,
    externalLinks: f.externalLinks.map((l) => l.trim()).filter((l) => l !== ''),
  };
}

export function fromRegulation(r: Regulation): RegulationFormValues {
  return {
    title: r.title,
    type: r.type,
    typeOther: r.typeOther ?? '',
    number: r.number,
    issuedDate: r.issuedDate,
    year: r.year === null ? '' : String(r.year),
    purpose: r.purpose ?? '',
    responsible: r.responsible ?? '',
    unit: r.unit,
    status: r.status,
    externalLinks: [...r.externalLinks],
  };
}

/** The `yyyy` part of an ISO date, or '' when it is not one. */
export function yearOf(isoDate: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? isoDate.slice(0, 4) : '';
}
