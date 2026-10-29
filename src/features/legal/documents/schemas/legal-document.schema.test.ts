import { describe, expect, it } from 'vitest';
import { emptyLegalDocumentForm, fromLegalDocument, legalDocumentFormSchema } from './legal-document.schema';

const valid = {
  ...emptyLegalDocumentForm(),
  docTitle: 'T',
  docType: 'REGULATION' as const,
  issueYear: '2026',
  docNumberDate: 'No 1',
  departmentId: 'dep-1',
};

describe('legalDocumentFormSchema', () => {
  it('accepts the required fields only', () => {
    expect(legalDocumentFormSchema.safeParse(valid).success).toBe(true);
  });

  it.each(['docTitle', 'docNumberDate', 'departmentId', 'issueYear'] as const)('%s is required', (k) => {
    const r = legalDocumentFormSchema.safeParse({ ...valid, [k]: '  ' });
    expect(r.success).toBe(false);
  });

  it('year must be an integer within 1900 and 2100', () => {
    for (const y of ['1899', '2101', '20.5', 'abc']) {
      expect(legalDocumentFormSchema.safeParse({ ...valid, issueYear: y }).success).toBe(false);
    }
    expect(legalDocumentFormSchema.safeParse({ ...valid, issueYear: '1900' }).success).toBe(true);
  });

  it('externalUrl is http or https only', () => {
    for (const u of ['javascript:alert(1)', 'ftp://a.b', 'not a url']) {
      expect(legalDocumentFormSchema.safeParse({ ...valid, externalUrl: u }).success).toBe(false);
    }
    for (const u of ['', 'http://a.b/x', 'https://a.b/x']) {
      expect(legalDocumentFormSchema.safeParse({ ...valid, externalUrl: u }).success).toBe(true);
    }
  });

  it('rejects unknown enums', () => {
    expect(legalDocumentFormSchema.safeParse({ ...valid, docType: 'decision' }).success).toBe(false);
    expect(legalDocumentFormSchema.safeParse({ ...valid, status: 'in_force' }).success).toBe(false);
  });

  it('fromLegalDocument round-trips nulls to empty strings', () => {
    const f = fromLegalDocument({
      id: '1', docTitle: 'T', docType: 'CONTRACT', issueYear: null, docNumberDate: 'N', status: 'ACTIVE',
      responsiblePerson: null, departmentId: null, department: null, purpose: null, externalUrl: null,
      createdAt: '', updatedAt: '',
    });
    expect(f).toMatchObject({ issueYear: '', responsiblePerson: '', departmentId: '', externalUrl: '' });
  });
});
