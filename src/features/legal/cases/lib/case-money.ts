import type { StatusTone } from '@/lib/constants/status';
import type { CaseStage, DualAmount, DualTotals, LegalCase } from '../types';

export function isCaseFinished(stage: CaseStage): boolean {
  return stage === 'completed' || stage === 'closed';
}

function addSide(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return (a ?? 0) + (b ?? 0);
}

/** damage + fine per currency; a side is null only when both inputs are null. */
export function caseTotal(c: Pick<LegalCase, 'damage' | 'fine'>): DualAmount {
  return {
    lak: addSide(c.damage.lak, c.fine.lak),
    usd: addSide(c.damage.usd, c.fine.usd),
  };
}

export function sumDual(values: readonly DualAmount[]): DualTotals {
  return values.reduce<DualTotals>(
    (acc, v) => ({ lak: acc.lak + (v.lak ?? 0), usd: acc.usd + (v.usd ?? 0) }),
    { lak: 0, usd: 0 },
  );
}

export const CASE_STAGE_TONE: Record<CaseStage, StatusTone> = {
  first_instance: 'amber',
  appeal: 'amber',
  cassation: 'amber',
  completed: 'emerald',
  closed: 'slate',
};
