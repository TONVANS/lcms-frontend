import { describe, expect, it } from 'vitest';
import { CASE_STAGES } from '../types';
import { CASE_STAGE_TONE, caseTotal, isCaseFinished, sumDual } from './case-money';

describe('isCaseFinished', () => {
  it('is true only for completed and closed', () => {
    const finished = CASE_STAGES.filter((s) => isCaseFinished(s));
    expect(finished).toEqual(['completed', 'closed']);
  });
});

describe('caseTotal', () => {
  it('sums per currency, null as 0', () => {
    expect(
      caseTotal({ damage: { lak: 100, usd: null }, fine: { lak: 50, usd: 20 } }),
    ).toEqual({ lak: 150, usd: 20 });
  });

  it('keeps a side null only when both inputs are null', () => {
    expect(
      caseTotal({ damage: { lak: null, usd: null }, fine: { lak: 0, usd: null } }),
    ).toEqual({ lak: 0, usd: null });
  });
});

describe('sumDual', () => {
  it('treats null as 0', () => {
    expect(
      sumDual([
        { lak: 1, usd: null },
        { lak: null, usd: 2 },
      ]),
    ).toEqual({ lak: 1, usd: 2 });
    expect(sumDual([])).toEqual({ lak: 0, usd: 0 });
  });
});

describe('CASE_STAGE_TONE', () => {
  it('has a tone for every stage', () => {
    for (const s of CASE_STAGES) expect(CASE_STAGE_TONE[s]).toBeTruthy();
    expect(CASE_STAGE_TONE.first_instance).toBe('amber');
    expect(CASE_STAGE_TONE.completed).toBe('emerald');
    expect(CASE_STAGE_TONE.closed).toBe('slate');
  });
});
