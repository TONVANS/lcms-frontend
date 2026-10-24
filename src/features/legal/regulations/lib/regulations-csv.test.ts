import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import type { Regulation } from '../types';
import { buildRegulationsCsv } from './regulations-csv';

const BASE: Regulation = {
  id: 'reg-1',
  title: 'Title one',
  type: 'decision',
  typeOther: null,
  number: '351/EDL',
  issuedDate: '2026-06-23',
  year: 2026,
  purpose: 'Purpose',
  responsible: 'Someone',
  unit: 'accounting',
  status: 'in_force',
  externalLinks: [],
  createdAt: '2026-06-23T00:00:00.000Z',
  updatedAt: '2026-06-23T00:00:00.000Z',
  createdBy: 'admin',
};

const lines = (csv: string) => csv.replace(/^﻿/, '').trimEnd().split('\r\n');

describe('buildRegulationsCsv', () => {
  it('header row is the 10 spec columns', () => {
    const header = lines(buildRegulationsCsv([]))[0];
    const f = lo.legal.fields;
    const expected = [
      f.number,
      f.issuedDate,
      f.title,
      f.type,
      f.year,
      f.purpose,
      f.responsible,
      f.unit,
      f.status,
      f.externalLinks,
    ];
    expect(header).toBe(expected.map((h) => `"${h}"`).join(','));
    expect(expected).toHaveLength(10);
  });

  it("a row with two links joins them with '; '", () => {
    const csv = buildRegulationsCsv([
      { ...BASE, externalLinks: ['https://a.example/1', 'https://b.example/2'] },
    ]);
    expect(lines(csv)[1]).toContain('"https://a.example/1; https://b.example/2"');
  });

  it('dates are dd/mm/yyyy', () => {
    const row = lines(buildRegulationsCsv([BASE]))[1];
    expect(row).toContain('"23/06/2026"');
    expect(row).not.toContain('2026-06-23');
  });

  it('labels are Lao, not keys', () => {
    const row = lines(buildRegulationsCsv([BASE]))[1];
    expect(row).toContain(`"${lo.legal.regulationTypes.decision}"`);
    expect(row).toContain(`"${lo.legal.units.accounting}"`);
    expect(row).toContain(`"${lo.legal.regulationStatus.in_force}"`);
    expect(row).not.toContain('in_force');
    expect(row).not.toContain('accounting');
  });

  it('writes empty cells for missing optional values and keeps the year numeric', () => {
    const row = lines(
      buildRegulationsCsv([{ ...BASE, year: null, purpose: null, responsible: null }]),
    )[1];
    expect(row).toBe(
      [
        '"351/EDL"',
        '"23/06/2026"',
        '"Title one"',
        `"${lo.legal.regulationTypes.decision}"`,
        '""',
        '""',
        '""',
        `"${lo.legal.units.accounting}"`,
        `"${lo.legal.regulationStatus.in_force}"`,
        '""',
      ].join(','),
    );
  });
});
