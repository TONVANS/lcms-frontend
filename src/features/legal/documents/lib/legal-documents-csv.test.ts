import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { toLegalDocument } from './legal-document-mapper';
import { buildLegalDocumentsCsv } from './legal-documents-csv';

const doc = toLegalDocument({
  id: '1',
  docTitle: 'Title',
  docType: 'MANUAL',
  issueYear: 2025,
  docNumberDate: 'No 5',
  status: 'INACTIVE',
  department: { id: 'd', name: 'Dept' },
  externalUrl: 'https://a.b',
});
const lines = (csv: string) => csv.replace(/^﻿/, '').trimEnd().split('\r\n');

describe('buildLegalDocumentsCsv', () => {
  it('writes the 9 headers', () => {
    expect(lines(buildLegalDocumentsCsv([]))[0]).toBe(
      lo.legal.regulations.csv.headers.map((h) => `"${h}"`).join(','),
    );
    expect(lo.legal.regulations.csv.headers).toHaveLength(9);
  });

  it('uses Lao labels and keeps empty cells empty', () => {
    const row = lines(buildLegalDocumentsCsv([doc]))[1];
    expect(row).toContain(`"${lo.legal.docTypes.MANUAL}"`);
    expect(row).toContain(`"${lo.legal.docStatus.INACTIVE}"`);
    expect(row).toContain('"Dept"');
    expect(row).not.toContain('MANUAL');
    expect(row).toBe(
      [
        '"Title"',
        '"No 5"',
        `"${lo.legal.docTypes.MANUAL}"`,
        '"2025"',
        '"Dept"',
        '""',
        `"${lo.legal.docStatus.INACTIVE}"`,
        '""',
        '"https://a.b"',
      ].join(','),
    );
  });
});
