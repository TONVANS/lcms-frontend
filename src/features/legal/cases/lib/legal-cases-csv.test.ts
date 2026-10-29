import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { toLegalCase } from './legal-case-mapper';
import { buildLegalCasesCsv } from './legal-cases-csv';

const c = toLegalCase({
  internalId: 'u',
  caseCode: 'C-1',
  defendant: 'Def',
  caseType: 'CRIMINAL',
  disputeStatus: 'SUPREME',
  damageLak: '100',
  fineLak: 20,
  date: '2026-03-05T00:00:00.000Z',
});
const lines = (csv: string) => csv.replace(/^﻿/, '').trimEnd().split('\r\n');

describe('buildLegalCasesCsv', () => {
  it('writes the 16 headers', () => {
    expect(lo.legal.cases.csv.headers).toHaveLength(16);
    expect(lines(buildLegalCasesCsv([]))[0]).toBe(lo.legal.cases.csv.headers.map((h) => `"${h}"`).join(','));
  });

  it('writes Lao labels, dd/mm/yyyy, computed total due and empty cells for null', () => {
    const row = lines(buildLegalCasesCsv([c]))[1];
    expect(row).toContain(`"${lo.legal.caseTypes.CRIMINAL}"`);
    expect(row).toContain(`"${lo.legal.disputeStatus.SUPREME}"`);
    expect(row).toContain('"05/03/2026"');
    expect(row).not.toContain('2026-03-05');
    const cells = row.split(',');
    expect(cells[6]).toBe('"100"');
    expect(cells[7]).toBe('""');
    expect(cells[10]).toBe('"120"');
    expect(cells[11]).toBe('""');
  });
});
