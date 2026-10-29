import type { FieldErrors, UseFormReturn } from 'react-hook-form';
import { lo } from '@/lib/i18n/lo';
import type { ApiError } from '@/types/api';
import type { GcFormValues } from '../schemas/gc.schema';
import { GC_FIELD_ORDER, firstInvalidFieldId, type GcFormFieldName } from './gc-contract-form-fields';

const FIELD_NAMES: ReadonlySet<string> = new Set(GC_FIELD_ORDER);

export interface AppliedServerErrors {
  /** Form fields that received a server error, in visual order. */
  matched: GcFormFieldName[];
  /** True when the server reported something that is not tied to a form field. */
  unmatched: boolean;
  /** DOM id of the control to focus for the first matched field, or null. */
  focusId: string | null;
}

/**
 * Puts server errors onto the form. A 409 is a duplicate contract number. Nest 400 bodies arrive as
 * one line per violation ("title should not be empty"); a line whose first word is a form field is
 * attached to it, anything else is reported through `unmatched` so the caller can show a banner.
 */
export function applyGcServerErrors(form: UseFormReturn<GcFormValues>, err: ApiError): AppliedServerErrors {
  let unmatched = false;
  const found = new Map<GcFormFieldName, string>();

  if (err.status === 409) {
    found.set('contractNumber', lo.gc.errors.duplicateNo);
  } else {
    for (const [key, message] of Object.entries(err.fieldErrors ?? {})) {
      if (FIELD_NAMES.has(key)) found.set(key as GcFormFieldName, message);
      else unmatched = true;
    }
    if (err.status === 400 && err.message) {
      for (const line of err.message.split('\n')) {
        const key = line.trim().split(/\s+/)[0] ?? '';
        if (FIELD_NAMES.has(key)) {
          if (!found.has(key as GcFormFieldName)) found.set(key as GcFormFieldName, line.trim());
        } else if (line.trim()) {
          unmatched = true;
        }
      }
    }
  }

  const errors: Record<string, unknown> = {};
  for (const [name, message] of found) {
    form.setError(name, { type: 'server', message });
    errors[name] = { type: 'server', message };
  }
  const matched = GC_FIELD_ORDER.filter((n) => found.has(n));
  return {
    matched,
    unmatched,
    focusId: matched.length > 0 ? firstInvalidFieldId(errors as FieldErrors<GcFormValues>) : null,
  };
}
