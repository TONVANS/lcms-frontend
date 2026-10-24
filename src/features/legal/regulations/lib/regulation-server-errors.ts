import type { FieldErrors, UseFormReturn } from 'react-hook-form';
import { lo } from '@/lib/i18n/lo';
import type { ApiError } from '@/types/api';
import type { RegulationFormValues } from '../schemas/regulation.schema';

export type RegulationFormFieldName = keyof RegulationFormValues;

/** Visual order of the fields; the first invalid one receives focus. */
export const REGULATION_FIELD_ORDER: readonly RegulationFormFieldName[] = [
  'title',
  'type',
  'typeOther',
  'number',
  'issuedDate',
  'year',
  'purpose',
  'responsible',
  'unit',
  'status',
  'externalLinks',
];

export const regulationFieldId = (name: string): string => `reg-field-${name}`;

/** DOM id of the control that should be focused for the first error in `errors`. */
export function firstInvalidRegulationFieldId(
  errors: FieldErrors<RegulationFormValues>,
): string | null {
  for (const name of REGULATION_FIELD_ORDER) {
    const err = errors[name];
    if (!err) continue;
    if (name === 'externalLinks') {
      const rows = err as unknown as Record<string, unknown>;
      const first = Object.keys(rows)
        .filter((k) => /^\d+$/.test(k) && rows[k])
        .map(Number)
        .sort((x, y) => x - y)[0];
      if (first !== undefined) return regulationFieldId(`externalLinks-${first}`);
      return regulationFieldId('externalLinks-add');
    }
    return regulationFieldId(name);
  }
  return null;
}

export interface AppliedRegulationServerErrors {
  /** Form fields that received a server error, in visual order. */
  matched: RegulationFormFieldName[];
  /** True when the server reported a key that is not a form field. */
  unmatched: boolean;
  /** DOM id of the control to focus for the first matched field, or null. */
  focusId: string | null;
}

/**
 * Puts server `fieldErrors` onto the regulation form. A duplicate regulation number gets its Lao message;
 * 409 status code maps to the number field.
 */
export function applyRegulationServerErrors(
  form: UseFormReturn<RegulationFormValues>,
  err: ApiError,
): AppliedRegulationServerErrors {
  let unmatched = false;
  const seen = new Set<RegulationFormFieldName>();
  const errors: Record<string, unknown> = {};

  if (err.status === 409 && !err.fieldErrors?.number) {
    const text = lo.legal.validation.numberDuplicate;
    form.setError('number', { type: 'server', message: text });
    errors.number = { type: 'server', message: text };
    seen.add('number');
  }

  for (const [key, message] of Object.entries(err.fieldErrors ?? {})) {
    if (!REGULATION_FIELD_ORDER.includes(key as RegulationFormFieldName)) {
      unmatched = true;
      continue;
    }
    const name = key as RegulationFormFieldName;
    const text =
      name === 'number' && (message === 'DUPLICATE_REGULATION_NO' || err.status === 409)
        ? lo.legal.validation.numberDuplicate
        : message;
    form.setError(name, { type: 'server', message: text });
    errors[name] = { type: 'server', message: text };
    seen.add(name);
  }

  const matched = REGULATION_FIELD_ORDER.filter((n) => seen.has(n));
  return {
    matched,
    unmatched,
    focusId: matched.length > 0 ? firstInvalidRegulationFieldId(errors as FieldErrors<RegulationFormValues>) : null,
  };
}
