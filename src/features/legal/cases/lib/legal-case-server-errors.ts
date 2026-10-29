import type { UseFormReturn } from 'react-hook-form';
import { lo } from '@/lib/i18n/lo';
import type { ApiError } from '@/types/api';
import type { LegalCaseFormValues } from '../schemas/legal-case.schema';

/** A 409 means the case code is taken: show it on that field. Returns the field it landed on, or null. */
export function applyLegalCaseServerError(
  form: UseFormReturn<LegalCaseFormValues>,
  err: ApiError,
): 'caseCode' | null {
  if (err.status !== 409) return null;
  form.setError('caseCode', { type: 'server', message: lo.legal.validation.caseCodeDuplicate });
  return 'caseCode';
}
