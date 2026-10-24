import type { CaseStage, DualTotals } from '../cases/types';
import type { LegalUnit } from '../constants';
import type { RegulationStatus, RegulationType } from '../regulations/types';

export interface LegalDashboard {
  regulations: {
    total: number;
    byStatus: Record<RegulationStatus, number>;
    unitCount: number; // distinct units that have >= 1 regulation
    byType: { type: RegulationType; count: number }[]; // every type, zero counts included
    byUnit: { unit: LegalUnit; count: number }[]; // only units with count > 0, sorted desc
  };
  cases: {
    total: number;
    inProgress: number;
    finished: number;
    byStage: { stage: CaseStage; count: number }[]; // every stage, in workflow order
    damage: DualTotals;
    fine: DualTotals;
    recovered: DualTotals;
  };
}
