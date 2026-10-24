import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import type { LegalCase } from '../types';
import { buildCasesCsv } from './cases-csv';

const BASE: LegalCase = {
  id: 'case-1',
  caseNo: 'LC-2026-001',
  defendant: 'John Doe',
  allegation: 'Breach of contract',
  handlingUnit: 'Finance Dept',
  caseType: 'civil',
  stage: 'first_instance',
  damage: { lak: 10000000, usd: 500 },
  fine: { lak: 2000000, usd: 100 },
  recovered: { lak: 5000000, usd: 250 },
  disputeDate: '2026-04-12',
  progress: 'In court hearing',
  createdAt: '2026-04-12T10:00:00.000Z',
  updatedAt: '2026-04-12T10:00:00.000Z',
  createdBy: 'admin',
};

const lines = (csv: string) => csv.replace(/^\uFEFF/, '').trimEnd().split('\r\n');

describe('buildCasesCsv', () => {
  it('16 header columns in order', () => {
    const csv = buildCasesCsv([]);
    const headerRow = lines(csv)[0];
    const headers = headerRow.split(',').map((h) => h.replace(/^"|"$/g, ''));
    expect(headers).toHaveLength(16);
    expect(headers).toEqual(lo.legal.cases.csv.headers);
  });

  it('total columns equal caseTotal', () => {
    const csv = buildCasesCsv([BASE]);
    const row = lines(csv)[1].split(',').map((h) => h.replace(/^"|"$/g, ''));
    expect(row[10]).toBe('12000000');
    expect(row[11]).toBe('600');
  });

  it('null amounts are empty cells, 0 is "0"', () => {
    const withZeroAndNull: LegalCase = {
      ...BASE,
      damage: { lak: 0, usd: null },
      fine: { lak: null, usd: 0 },
      recovered: { lak: null, usd: null },
    };
    const csv = buildCasesCsv([withZeroAndNull]);
    const row = lines(csv)[1].split(',').map((h) => h.replace(/^"|"$/g, ''));
    expect(row[6]).toBe('0');
    expect(row[7]).toBe('');
    expect(row[8]).toBe('');
    expect(row[9]).toBe('0');
    expect(row[10]).toBe('0');
    expect(row[11]).toBe('0');
    expect(row[12]).toBe('');
    expect(row[13]).toBe('');
  });

  it('null disputeDate is empty', () => {
    const withoutDate: LegalCase = {
      ...BASE,
      disputeDate: null,
    };
    const csv = buildCasesCsv([withoutDate]);
    const row = lines(csv)[1].split(',').map((h) => h.replace(/^"|"$/g, ''));
    expect(row[14]).toBe('');
  });
});
