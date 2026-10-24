import type { StatusTone } from '@/lib/constants/status';
import type { ID, ISODate } from '@/types/api';
import type { LegalUnit } from '../constants';

export const REGULATION_TYPES = [
  'decision',
  'provision',
  'notice',
  'rule',
  'instruction',
  'other',
] as const;
export type RegulationType = (typeof REGULATION_TYPES)[number];

export const REGULATION_STATUSES = ['in_force', 'repealed'] as const;
export type RegulationStatus = (typeof REGULATION_STATUSES)[number];

export const REGULATION_SORT_KEYS = ['issuedDate', 'title', 'number'] as const;
export type RegulationSortKey = (typeof REGULATION_SORT_KEYS)[number];

export const REGULATION_STATUS_TONE: Record<RegulationStatus, StatusTone> = {
  in_force: 'emerald',
  repealed: 'slate',
};

export interface Regulation {
  id: ID;
  title: string;
  type: RegulationType;
  typeOther: string | null;
  number: string;
  issuedDate: ISODate;
  year: number | null;
  purpose: string | null;
  responsible: string | null;
  unit: LegalUnit;
  status: RegulationStatus;
  externalLinks: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
