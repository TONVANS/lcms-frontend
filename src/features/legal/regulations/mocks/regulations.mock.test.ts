import { beforeEach, describe, expect, it } from 'vitest';
import { LEGAL_UNITS } from '../../constants';
import { REGULATION_STATUSES, REGULATION_TYPES } from '../types';
import type { RegulationInput } from '../schemas/regulation.schema';
import { createRegulationSeed, regulationsMockDb } from './regulations.mock';

const TODAY = new Date(2026, 9, 24); // 24 Oct 2026, local time

describe('createRegulationSeed', () => {
  it('seed has 30 records covering every type, both statuses and all 12 units', () => {
    const seed = createRegulationSeed(TODAY);
    expect(seed).toHaveLength(30);
    expect(seed.map((r) => r.id)).toEqual(Array.from({ length: 30 }, (_, i) => `reg-${i + 1}`));
    expect(new Set(seed.map((r) => r.type))).toEqual(new Set(REGULATION_TYPES));
    expect(new Set(seed.map((r) => r.status))).toEqual(new Set(REGULATION_STATUSES));
    expect(new Set(seed.map((r) => r.unit))).toEqual(new Set(LEGAL_UNITS));
  });

  it('exactly one other-type record, with typeOther set', () => {
    const others = createRegulationSeed(TODAY).filter((r) => r.type === 'other');
    expect(others).toHaveLength(1);
    expect(others[0].typeOther).toBeTruthy();
    expect(createRegulationSeed(TODAY).filter((r) => r.type !== 'other' && r.typeOther !== null)).toHaveLength(0);
  });

  it('reg-1 is the team sample', () => {
    const r = createRegulationSeed(TODAY)[0];
    expect(r.id).toBe('reg-1');
    expect(r.title).toContain('KPIs');
    expect(r.number).toBe('351/ຟຟລ.ຝບຊ');
    expect(r.unit).toBe('accounting');
    expect(r.status).toBe('in_force');
    expect(r.issuedDate).toBe('2026-06-23');
    expect(r.year).toBe(2026);
  });

  it('reg-1 falls back to the previous year when 23 June is still ahead', () => {
    const r = createRegulationSeed(new Date(2026, 2, 10))[0];
    expect(r.issuedDate).toBe('2025-06-23');
    expect(r.year).toBe(2025);
    for (const x of createRegulationSeed(new Date(2026, 2, 10))) {
      expect(x.issuedDate <= '2026-03-10').toBe(true);
    }
  });

  it('link coverage', () => {
    const seed = createRegulationSeed(TODAY);
    expect(seed.filter((r) => r.externalLinks.length >= 2).length).toBeGreaterThanOrEqual(3);
    expect(seed.filter((r) => r.externalLinks.length === 0).length).toBeGreaterThanOrEqual(10);
    for (const r of seed) for (const l of r.externalLinks) expect(l.startsWith('https://')).toBe(true);
  });

  it('numbers are unique case-insensitively', () => {
    const nums = createRegulationSeed(TODAY).map((r) => r.number.toLowerCase());
    expect(new Set(nums).size).toBe(nums.length);
  });

  it('issuedDate values are valid ISO dates and none is after today', () => {
    for (const r of createRegulationSeed(TODAY)) {
      expect(r.issuedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(r.issuedDate))).toBe(false);
      expect(r.issuedDate <= '2026-10-24').toBe(true);
    }
  });
});

describe('regulationsMockDb', () => {
  beforeEach(() => regulationsMockDb.reset(TODAY));

  const input: RegulationInput = {
    title: 't',
    type: 'rule',
    typeOther: null,
    number: '999/x',
    issuedDate: '2026-01-01',
    year: 2026,
    purpose: null,
    responsible: null,
    unit: 'ict',
    status: 'in_force',
    externalLinks: [],
  };

  it('insert assigns reg-1001 and timestamps; update keeps id; remove deletes; reset restores 30', () => {
    const created = regulationsMockDb.insert(input, 'admin');
    expect(created.id).toBe('reg-1001');
    expect(created.createdBy).toBe('admin');
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();
    expect(regulationsMockDb.all()).toHaveLength(31);

    const updated = regulationsMockDb.update('reg-1001', { title: 'new' });
    expect(updated.id).toBe('reg-1001');
    expect(updated.title).toBe('new');

    regulationsMockDb.remove('reg-1001');
    expect(regulationsMockDb.get('reg-1001')).toBeUndefined();

    regulationsMockDb.insert(input, 'admin');
    regulationsMockDb.reset(TODAY);
    expect(regulationsMockDb.all()).toHaveLength(30);
    expect(regulationsMockDb.insert(input, 'admin').id).toBe('reg-1001');
  });

  it('returns copies', () => {
    const a = regulationsMockDb.get('reg-1')!;
    a.title = 'mutated';
    expect(regulationsMockDb.get('reg-1')!.title).not.toBe('mutated');
  });
});
