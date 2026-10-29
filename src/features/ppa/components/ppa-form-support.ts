import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, UseFormReturn } from 'react-hook-form';
import { toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import type { ApiError } from '@/types/api';
import { powerContractSchema, type PowerFormValues } from '../schemas/ppa.schema';
import { ppaFieldId, projectTypeIssue } from './ppa-contract-form-fields';

export interface ProjectTypeState {
  types: readonly string[];
  ready: boolean;
  /** Value the form started with (a legacy value stays valid while unchanged). */
  initial: string;
}

/** zod schema plus the PURCHASE project-type membership check against the loaded list. */
export function makePowerResolver(state: ProjectTypeState): Resolver<PowerFormValues> {
  const base = zodResolver(powerContractSchema) as Resolver<PowerFormValues>;
  return async (values, context, options) => {
    const result = await base(values, context, options);
    const { types, ready, initial } = state;
    const issue = projectTypeIssue(values, types, ready, initial);
    if (!issue || result.errors.projectTypeOrCustomer) return result;
    return {
      values: {},
      errors: {
        ...result.errors,
        projectTypeOrCustomer: { type: 'validate', message: issue },
      },
    } as typeof result;
  };
}

export interface AppliedServerError {
  /** DOM id of the control to focus, or null. */
  focusId: string | null;
  /** Message for a banner (empty when the error was shown on a field). */
  banner: string | null;
}

/** 409 -> duplicate contract number on its field; everything else -> banner text. */
export function applyPpaServerError(form: UseFormReturn<PowerFormValues>, err: ApiError): AppliedServerError {
  if (err.status === 409) {
    form.setError('contractNumber', { type: 'server', message: lo.ppa.errors.duplicateNo });
    return { focusId: ppaFieldId('contractNumber'), banner: null };
  }
  const text = toUserMessage(err);
  return { focusId: null, banner: text || null };
}
