import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import type { Regulation } from '../types';
import {
  emptyRegulationForm,
  fromRegulation,
  regulationFormSchema,
  toRegulationPayload,
  yearOf,
} from './regulation.schema';

const v = lo.legal.validation;

const base = {
  ...emptyRegulationForm(),
  title: 'T',
  number: '12/EDL',
  issuedDate: '2026-01-15',
};

function messages(input: unknown): Map<string, string> {
  const r = regulationFormSchema.safeParse(input);
  const m = new Map<string, string>();
  if (!r.success) for (const i of r.error.issues) if (!m.has(i.path.join('.'))) m.set(i.path.join('.'), i.message);
  return m;
}

const ok = (input: unknown) => regulationFormSchema.safeParse(input).success;

describe('regulationFormSchema', () => {
  it('accepts a minimal valid form', () => {
    expect(ok(base)).toBe(true);
  });

  it('requires title, number, issuedDate', () => {
    expect(messages({ ...base, title: ' ' }).get('title')).toBe(v.required);
    expect(messages({ ...base, number: '' }).get('number')).toBe(v.required);
    expect(messages({ ...base, issuedDate: '' }).get('issuedDate')).toBe(v.required);
  });

  it('rejects a non-calendar issuedDate', () => {
    expect(messages({ ...base, issuedDate: '2026-02-30' }).get('issuedDate')).toBe(v.dateInvalid);
    expect(messages({ ...base, issuedDate: 'soon' }).get('issuedDate')).toBe(v.dateInvalid);
  });

  it('title over 300 chars is rejected', () => {
    expect(ok({ ...base, title: 'a'.repeat(300) })).toBe(true);
    expect(messages({ ...base, title: 'a'.repeat(301) }).get('title')).toBe(v.titleMax);
  });

  it('limits number, typeOther and responsible with textMax', () => {
    expect(messages({ ...base, number: 'a'.repeat(101) }).get('number')).toBe(v.textMax);
    expect(messages({ ...base, type: 'other', typeOther: 'a'.repeat(101) }).get('typeOther')).toBe(v.textMax);
    expect(messages({ ...base, responsible: 'a'.repeat(201) }).get('responsible')).toBe(v.textMax);
    expect(ok({ ...base, responsible: 'a'.repeat(200) })).toBe(true);
  });

  it('typeOther is required only when type is other', () => {
    expect(messages({ ...base, type: 'other', typeOther: '' }).get('typeOther')).toBe(v.typeOtherRequired);
    expect(messages({ ...base, type: 'other', typeOther: '  ' }).get('typeOther')).toBe(v.typeOtherRequired);
    expect(ok({ ...base, type: 'notice', typeOther: '' })).toBe(true);
    expect(ok({ ...base, type: 'other', typeOther: 'Circular' })).toBe(true);
  });

  it('reports typeOther together with other field errors', () => {
    const m = messages({ ...base, title: '', type: 'other', typeOther: '' });
    expect(m.get('title')).toBe(v.required);
    expect(m.get('typeOther')).toBe(v.typeOtherRequired);
  });

  it("year accepts '' or 1975..2100", () => {
    expect(ok({ ...base, year: '' })).toBe(true);
    expect(ok({ ...base, year: '1975' })).toBe(true);
    expect(ok({ ...base, year: '2100' })).toBe(true);
    for (const y of ['1974', '2101', '20x6']) expect(messages({ ...base, year: y }).get('year')).toBe(v.yearRange);
  });

  it('externalLinks accept only https URLs (Review Focus 3)', () => {
    for (const bad of ['http://a.la', 'javascript:alert(1)', 'drive file']) {
      expect(messages({ ...base, externalLinks: ['https://ok.la/x', bad] }).get('externalLinks.1')).toBe(v.urlInvalid);
    }
    expect(ok({ ...base, externalLinks: ['https://drive.google.com/x'] })).toBe(true);
  });

  it('ignores blank link rows and counts only non-blank entries toward the cap', () => {
    expect(ok({ ...base, externalLinks: ['', '  ', 'https://a.la'] })).toBe(true);
    const ten = Array.from({ length: 10 }, (_, i) => `https://a.la/${i}`);
    expect(ok({ ...base, externalLinks: [...ten, '', ' '] })).toBe(true);
    expect(messages({ ...base, externalLinks: [...ten, 'https://a.la/10'] }).get('externalLinks')).toBe(v.linksMax);
  });

  it('at most 10 links', () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `https://a.la/${i}`);
    expect(messages({ ...base, externalLinks: eleven }).get('externalLinks')).toBe(v.linksMax);
  });

  it('purpose over 2000 chars is rejected', () => {
    expect(ok({ ...base, purpose: 'a'.repeat(2000) })).toBe(true);
    expect(messages({ ...base, purpose: 'a'.repeat(2001) }).get('purpose')).toBe(v.purposeMax);
  });

  it('never lets a zod English default message through', () => {
    const bad = {
      title: 5, type: 'nope', typeOther: 1, number: null, issuedDate: undefined, year: 3,
      purpose: 1, responsible: 1, unit: 'x', status: 'y', externalLinks: 'z',
    };
    const all = new Set<string>(Object.values(v));
    const r = regulationFormSchema.safeParse(bad);
    expect(r.success).toBe(false);
    if (!r.success) for (const i of r.error.issues) expect(all.has(i.message), `${i.path.join('.')}: ${i.message}`).toBe(true);
  });
});

describe('payload mapping', () => {
  it('toRegulationPayload trims, nulls blanks, converts year, clears typeOther for non-other types', () => {
    const p = toRegulationPayload({
      ...base,
      title: ' T ',
      number: ' 12/EDL ',
      type: 'notice',
      typeOther: 'leftover',
      year: ' 2026 ',
      purpose: '  ',
      responsible: ' ',
      externalLinks: [' https://a.la ', '', '  '],
    });
    expect(p).toEqual({
      title: 'T',
      type: 'notice',
      typeOther: null,
      number: '12/EDL',
      issuedDate: '2026-01-15',
      year: 2026,
      purpose: null,
      responsible: null,
      unit: 'edl_office',
      status: 'in_force',
      externalLinks: ['https://a.la'],
    });
  });

  it('keeps typeOther for other and nulls blank year', () => {
    const p = toRegulationPayload({ ...base, type: 'other', typeOther: ' Circular ', year: '' });
    expect(p.typeOther).toBe('Circular');
    expect(p.year).toBeNull();
  });

  it('yearOf extracts yyyy or empty', () => {
    expect(yearOf('2026-03-04')).toBe('2026');
    expect(yearOf('')).toBe('');
    expect(yearOf('bad')).toBe('');
  });

  it('fromRegulation(toRegulationPayload(f)) round-trips a full form', () => {
    const f = {
      title: 'T',
      type: 'other' as const,
      typeOther: 'Circular',
      number: '9/EDL',
      issuedDate: '2025-05-06',
      year: '2025',
      purpose: 'p',
      responsible: 'r',
      unit: 'ict' as const,
      status: 'repealed' as const,
      externalLinks: ['https://a.la/1', 'https://a.la/2'],
    };
    const p = toRegulationPayload(f);
    const reg: Regulation = { ...p, id: '1', createdAt: '', updatedAt: '', createdBy: 'u' };
    expect(fromRegulation(reg)).toEqual(f);
  });
});
