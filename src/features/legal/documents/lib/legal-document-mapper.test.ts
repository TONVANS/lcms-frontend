import { describe, expect, it } from 'vitest';
import {
  diffLegalDocumentPayload,
  toLegalDocument,
  toLegalDocumentPayload,
  toLegalDocumentsDashboard,
} from './legal-document-mapper';
import { emptyLegalDocumentForm } from '../schemas/legal-document.schema';

describe('toLegalDocument', () => {
  it('maps a backend row with nested department and numeric strings', () => {
    const d = toLegalDocument({
      id: 'd1',
      docTitle: ' Title ',
      docType: 'PROVISION',
      issueYear: '2026',
      docNumberDate: 'No 1, 15/01/2026',
      status: 'INACTIVE',
      responsiblePerson: '',
      departmentId: 'dep-1',
      department: { id: 'dep-1', name: 'Legal' },
      purpose: null,
      externalUrl: 'https://x.test/a',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-16T00:00:00.000Z',
    });
    expect(d).toMatchObject({
      id: 'd1',
      docTitle: 'Title',
      docType: 'PROVISION',
      issueYear: 2026,
      status: 'INACTIVE',
      responsiblePerson: null,
      departmentId: 'dep-1',
      department: { id: 'dep-1', name: 'Legal', code: null },
      purpose: null,
    });
  });

  it('is tolerant of junk', () => {
    const d = toLegalDocument({ id: 7, docType: 'weird', status: 'x', department: 'no' });
    expect(d.id).toBe('7');
    expect(d.docType).toBe('OTHER');
    expect(d.status).toBe('ACTIVE');
    expect(d.department).toBeNull();
    expect(d.issueYear).toBeNull();
    expect(toLegalDocument(null).id).toBe('');
  });

  it('derives departmentId from the nested department', () => {
    expect(toLegalDocument({ id: 'a', department: { id: 'z', name: 'Z' } }).departmentId).toBe('z');
  });
});

describe('payload and diff', () => {
  const form = {
    ...emptyLegalDocumentForm(),
    docTitle: ' T ',
    docType: 'MANUAL' as const,
    issueYear: '2024',
    docNumberDate: ' N ',
    departmentId: 'dep-1',
  };

  it('builds the DTO, trimming and omitting empty optionals', () => {
    expect(toLegalDocumentPayload(form)).toEqual({
      docTitle: 'T',
      docType: 'MANUAL',
      issueYear: 2024,
      docNumberDate: 'N',
      status: 'ACTIVE',
      departmentId: 'dep-1',
    });
    expect(
      toLegalDocumentPayload({ ...form, responsiblePerson: 'P', purpose: 'U', externalUrl: 'https://a.b' }),
    ).toMatchObject({ responsiblePerson: 'P', purpose: 'U', externalUrl: 'https://a.b' });
  });

  it('diff sends only changed keys and null for cleared optionals', () => {
    const before = toLegalDocumentPayload({ ...form, purpose: 'old', responsiblePerson: 'R' });
    const after = toLegalDocumentPayload({ ...form, purpose: '', responsiblePerson: 'R', docTitle: 'New' });
    expect(diffLegalDocumentPayload(after, before)).toEqual({ docTitle: 'New', purpose: null });
    expect(diffLegalDocumentPayload(before, before)).toEqual({});
  });
});

describe('toLegalDocumentsDashboard', () => {
  it('reads object maps', () => {
    const d = toLegalDocumentsDashboard({
      data: {
        total: '10',
        active: 7,
        inactive: 3,
        byType: { REGULATION: 4, OTHER: '6' },
        byDepartment: [{ departmentId: 'a', departmentName: 'A', count: 5 }],
      },
    });
    expect(d.total).toBe(10);
    expect(d.byType).toEqual([
      { docType: 'REGULATION', count: 4 },
      { docType: 'OTHER', count: 6 },
    ]);
    expect(d.byDepartment).toEqual([{ departmentId: 'a', name: 'A', count: 5 }]);
  });

  it('reads groupBy arrays and derives totals', () => {
    const d = toLegalDocumentsDashboard({
      byStatus: [
        { status: 'ACTIVE', _count: 3 },
        { status: 'INACTIVE', _count: { _all: 2 } },
      ],
      byType: [{ docType: 'MANUAL', _count: 5 }],
      byDepartment: [{ department: { id: 'q', name: 'Q' }, count: 5 }],
    });
    expect(d).toMatchObject({ total: 5, active: 3, inactive: 2 });
    expect(d.byType).toEqual([{ docType: 'MANUAL', count: 5 }]);
    expect(d.byDepartment).toEqual([{ departmentId: 'q', name: 'Q', count: 5 }]);
  });

  it('survives garbage', () => {
    expect(toLegalDocumentsDashboard(undefined)).toEqual({
      total: 0, active: 0, inactive: 0, byType: [], byDepartment: [],
    });
  });
});
