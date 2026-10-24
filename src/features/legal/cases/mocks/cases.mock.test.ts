import { beforeEach, describe, expect, it } from 'vitest';
import { caseTotal } from '../lib/case-money';
import { CASE_STAGES, CASE_TYPES, type CaseInput } from '../types';
import { casesMockDb, createCaseSeed } from './cases.mock';

const TODAY = new Date(2026, 9, 24); // 24 Oct 2026

describe('createCaseSeed', () => {
  it('24 records covering every stage and every case type', () => {
    const seed = createCaseSeed(TODAY);
    expect(seed).toHaveLength(24);
    expect(seed.map((c) => c.id)).toEqual(Array.from({ length: 24 }, (_, i) => `case-${i + 1}`));
    expect(new Set(seed.map((c) => c.stage))).toEqual(new Set(CASE_STAGES));
    expect(new Set(seed.map((c) => c.caseType))).toEqual(new Set(CASE_TYPES));
  });

  it('amount coverage: at least one record each that is LAK-only, USD-only, mixed, all-null, recovered 0, recovered partial, and recovered equal to its total', () => {
    const seed = createCaseSeed(TODAY);

    const isLakOnly = seed.some(
      (c) =>
        (c.damage.lak !== null || c.fine.lak !== null) &&
        c.damage.usd === null &&
        c.fine.usd === null &&
        c.recovered.usd === null,
    );
    expect(isLakOnly).toBe(true);

    const isUsdOnly = seed.some(
      (c) =>
        (c.damage.usd !== null || c.fine.usd !== null) &&
        c.damage.lak === null &&
        c.fine.lak === null &&
        c.recovered.lak === null,
    );
    expect(isUsdOnly).toBe(true);

    const isMixed = seed.some(
      (c) =>
        (c.damage.lak !== null || c.fine.lak !== null || c.recovered.lak !== null) &&
        (c.damage.usd !== null || c.fine.usd !== null || c.recovered.usd !== null),
    );
    expect(isMixed).toBe(true);

    const isAllNull = seed.some(
      (c) =>
        c.damage.lak === null &&
        c.damage.usd === null &&
        c.fine.lak === null &&
        c.fine.usd === null &&
        c.recovered.lak === null &&
        c.recovered.usd === null,
    );
    expect(isAllNull).toBe(true);

    const hasRecoveredZero = seed.some(
      (c) =>
        (c.recovered.lak === 0 && (c.recovered.usd === 0 || c.recovered.usd === null)) ||
        (c.recovered.usd === 0 && (c.recovered.lak === 0 || c.recovered.lak === null)),
    );
    expect(hasRecoveredZero).toBe(true);

    const hasRecoveredPartial = seed.some((c) => {
      const tot = caseTotal(c);
      const recLak = c.recovered.lak ?? 0;
      const recUsd = c.recovered.usd ?? 0;
      const totLak = tot.lak ?? 0;
      const totUsd = tot.usd ?? 0;
      const recTotal = recLak + recUsd;
      const totalAmount = totLak + totUsd;
      return recTotal > 0 && recTotal < totalAmount;
    });
    expect(hasRecoveredPartial).toBe(true);

    const hasRecoveredFull = seed.some((c) => {
      const tot = caseTotal(c);
      const recLak = c.recovered.lak ?? 0;
      const recUsd = c.recovered.usd ?? 0;
      const totLak = tot.lak ?? 0;
      const totUsd = tot.usd ?? 0;
      return (
        totLak + totUsd > 0 &&
        recLak === totLak &&
        recUsd === totUsd
      );
    });
    expect(hasRecoveredFull).toBe(true);
  });

  it('exactly one record has a null disputeDate; none is in the future', () => {
    const seed = createCaseSeed(TODAY);
    const nullDates = seed.filter((c) => c.disputeDate === null);
    expect(nullDates).toHaveLength(1);

    const nonNullDates = seed.filter((c) => c.disputeDate !== null);
    expect(nonNullDates).toHaveLength(23);
    for (const c of nonNullDates) {
      expect(c.disputeDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.disputeDate! <= '2026-10-24').toBe(true);
    }
  });

  it('caseNo values are unique and match ^LC-\\d{4}-\\d{3}$', () => {
    const seed = createCaseSeed(TODAY);
    const nos = seed.map((c) => c.caseNo);
    expect(new Set(nos).size).toBe(nos.length);
    for (const no of nos) {
      expect(no).toMatch(/^LC-\d{4}-\d{3}$/);
    }
  });
});

describe('casesMockDb', () => {
  beforeEach(() => casesMockDb.reset(TODAY));

  const sampleInput: CaseInput = {
    defendant: 'ທ້າວ ສົມສັກ',
    allegation: 'ລັກສາຍໄຟຟ້າ',
    handlingUnit: 'ສານປະຊາຊົນນະຄອນຫຼວງ',
    caseType: 'criminal',
    stage: 'first_instance',
    damage: { lak: 10000000, usd: null },
    fine: { lak: 2000000, usd: null },
    recovered: { lak: 0, usd: null },
    disputeDate: '2026-05-10',
    progress: 'ກຳລັງດຳເນີນຄະດີ',
  };

  it('insert numbers the next case of the year: with today in 2026 and highest existing LC-2026-012, next is LC-2026-013', () => {
    // Reset DB with a seed filtered to max LC-2026-012
    casesMockDb.reset(TODAY);
    // Keep only records up to LC-2026-012
    for (let i = 13; i <= 24; i += 1) {
      casesMockDb.remove(`case-${i}`);
    }
    const maxBefore = Math.max(
      ...casesMockDb
        .all()
        .filter((c) => c.caseNo.startsWith('LC-2026-'))
        .map((c) => parseInt(c.caseNo.slice(8), 10)),
    );
    expect(maxBefore).toBe(12);

    const inserted = casesMockDb.insert(sampleInput, 'admin');
    expect(inserted.caseNo).toBe('LC-2026-013');
  });

  it('insert assigns case-1001 and timestamps; update keeps id; remove deletes; reset restores 24', () => {
    const created = casesMockDb.insert(sampleInput, 'admin');
    expect(created.id).toBe('case-1001');
    expect(created.createdBy).toBe('admin');
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();
    expect(casesMockDb.all()).toHaveLength(25);

    const updated = casesMockDb.update('case-1001', { defendant: 'ທ້າວ ບຸນມີ' });
    expect(updated.id).toBe('case-1001');
    expect(updated.defendant).toBe('ທ້າວ ບຸນມີ');

    casesMockDb.remove('case-1001');
    expect(casesMockDb.get('case-1001')).toBeUndefined();

    casesMockDb.insert(sampleInput, 'admin');
    casesMockDb.reset(TODAY);
    expect(casesMockDb.all()).toHaveLength(24);
    expect(casesMockDb.insert(sampleInput, 'admin').id).toBe('case-1001');
  });

  it('returns deep copies so mutations outside do not corrupt DB', () => {
    const c = casesMockDb.get('case-1')!;
    c.defendant = 'mutated';
    c.damage.lak = 999999999;
    expect(casesMockDb.get('case-1')!.defendant).not.toBe('mutated');
    expect(casesMockDb.get('case-1')!.damage.lak).not.toBe(999999999);
  });
});
