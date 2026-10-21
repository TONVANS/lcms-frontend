import type { FieldErrors, UseFormReturn } from 'react-hook-form';
import { lo } from '@/lib/i18n/lo';
import type { ApiError } from '@/types/api';
import type { GcFormValues } from '../schemas/gc.schema';
import { GC_FIELD_ORDER, firstInvalidFieldId, type GcFormFieldName } from './gc-contract-form-fields';

const FIELD_NAMES: ReadonlySet<string> = new Set(GC_FIELD_ORDER);

export interface AppliedServerErrors {
  /** Form fields that received a server error, in visual order. */
  matched: GcFormFieldName[];
  /** True when the server reported a key that is not a form field. */
  unmatched: boolean;
  /** DOM id of the control to focus for the first matched field, or null. */
  focusId: string | null;
}

/**
 * Puts server `fieldErrors` onto the form. A duplicate contract number gets its Lao message;
 * keys that match no field are only reported through `unmatched` so the caller can show a banner.
 */
export function applyGcServerErrors(form: UseFormReturn<GcFormValues>, err: ApiError): AppliedServerErrors {
  let unmatched = false;
  const seen = new Set<GcFormFieldName>();
  const errors: Record<string, unknown> = {};
  for (const [key, message] of Object.entries(err.fieldErrors ?? {})) {
    if (!FIELD_NAMES.has(key)) {
      unmatched = true;
      continue;
    }
    const name = key as GcFormFieldName;
    const text =
      name === 'contractNo' && message === 'DUPLICATE_CONTRACT_NO' ? lo.gc.errors.duplicateNo : message;
    form.setError(name, { type: 'server', message: text });
    errors[name] = { type: 'server', message: text };
    seen.add(name);
  }
  const matched = GC_FIELD_ORDER.filter((n) => seen.has(n));
  return {
    matched,
    unmatched,
    focusId: matched.length > 0 ? firstInvalidFieldId(errors as FieldErrors<GcFormValues>) : null,
  };
}
