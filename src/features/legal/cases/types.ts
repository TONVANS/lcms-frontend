import type { ID, ISODate } from '@/types/api';

export const CASE_TYPES = ['civil', 'criminal', 'commercial', 'other'] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export const CASE_STAGES = [
  'first_instance',
  'appeal',
  'cassation',
  'completed',
  'closed',
] as const;
export type CaseStage = (typeof CASE_STAGES)[number];

export const CASE_SORT_KEYS = ['disputeDate', 'caseNo', 'defendant'] as const;
export type CaseSortKey = (typeof CASE_SORT_KEYS)[number];

export const CASE_PROGRESS_FILTERS = ['in_progress', 'finished'] as const;
export type CaseProgressFilter = (typeof CASE_PROGRESS_FILTERS)[number];

/** LAK and USD carried at the same time; null means not entered. */
export interface DualAmount {
  lak: number | null;
  usd: number | null;
}

export interface DualTotals {
  lak: number;
  usd: number;
}

export interface LegalCase {
  id: ID;
  caseNo: string;
  defendant: string;
  allegation: string;
  handlingUnit: string;
  caseType: CaseType;
  stage: CaseStage;
  damage: DualAmount;
  fine: DualAmount;
  recovered: DualAmount;
  disputeDate: ISODate | null;
  progress: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type CaseInput = Omit<LegalCase, 'id' | 'caseNo' | 'createdAt' | 'updatedAt' | 'createdBy'>;
