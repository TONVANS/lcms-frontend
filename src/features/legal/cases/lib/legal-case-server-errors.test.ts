import { describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { applyLegalCaseServerError } from './legal-case-server-errors';

describe('applyLegalCaseServerError', () => {
  it('puts a 409 on the caseCode field', () => {
    const form = { setError: vi.fn() };
    const field = applyLegalCaseServerError(form as never, { status: 409, code: 'HTTP_409', message: '' });
    expect(field).toBe('caseCode');
    expect(form.setError).toHaveBeenCalledWith('caseCode', {
      type: 'server',
      message: lo.legal.validation.caseCodeDuplicate,
    });
  });

  it('ignores other errors', () => {
    const form = { setError: vi.fn() };
    expect(applyLegalCaseServerError(form as never, { status: 500, code: 'HTTP_500', message: '' })).toBeNull();
    expect(form.setError).not.toHaveBeenCalled();
  });
});
