import type { StatusTone } from '@/lib/constants/status';
import type { Department } from '@/types/domain';

export const CASE_TYPES = ['COMMERCIAL', 'CIVIL', 'CRIMINAL', 'ADMINISTRATIVE', 'OTHER'] as const;
export type CaseType = (typeof CASE_TYPES)[number];

/** In workflow order. */
export const DISPUTE_STATUSES = ['FIRST_INSTANCE', 'APPEAL', 'SUPREME', 'CLOSED', 'RESOLVED'] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export const DISPUTE_STATUS_TONE: Record<DisputeStatus, StatusTone> = {
  FIRST_INSTANCE: 'amber',
  APPEAL: 'amber',
  SUPREME: 'amber',
  RESOLVED: 'emerald',
  CLOSED: 'slate',
};

export const AMOUNT_KEYS = [
  'damageLak',
  'damageUsd',
  'fineLak',
  'fineUsd',
  'recoveredLak',
  'recoveredUsd',
] as const;
export type AmountKey = (typeof AMOUNT_KEYS)[number];

export type Currency2 = 'lak' | 'usd';
export interface MoneyTotals {
  damage: number;
  fine: number;
  totalDue: number;
  recovered: number;
}

export interface LegalCase {
  /** Backend `internalId` (UUID) when present, otherwise `id`. */
  id: string;
  caseCode: string;
  defendant: string;
  allegation: string | null;
  departmentId: string | null;
  department: Department | null;
  departmentAction: string | null;
  caseType: CaseType;
  damageLak: number | null;
  damageUsd: number | null;
  fineLak: number | null;
  fineUsd: number | null;
  totalDueLak: number | null;
  totalDueUsd: number | null;
  disputeStatus: DisputeStatus;
  recoveredLak: number | null;
  recoveredUsd: number | null;
  /** YYYY-MM-DD */
  date: string | null;
  disputeProgress: string | null;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /legal-cases (CreateLegalCaseDto). totalDue* is never sent. */
export interface LegalCasePayload {
  caseCode: string;
  defendant: string;
  caseType: CaseType;
  disputeStatus: DisputeStatus;
  date: string;
  damageLak: number;
  damageUsd: number;
  fineLak: number;
  fineUsd: number;
  recoveredLak: number;
  recoveredUsd: number;
  allegation?: string;
  departmentId?: string;
  departmentAction?: string;
  disputeProgress?: string;
  externalUrl?: string;
}

/** Body of PATCH: only changed keys; a cleared optional field is `null`. */
export type LegalCasePatch = {
  [K in keyof LegalCasePayload]?: LegalCasePayload[K] | null;
};

export interface LegalCasesDashboard {
  total: number;
  byDisputeStatus: { status: DisputeStatus; count: number }[];
  lak: MoneyTotals;
  usd: MoneyTotals;
}
