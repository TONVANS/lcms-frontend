import type { Money } from '@/types/domain';

export const GC_CONTRACT_TYPES = [
  'om_service',
  'equipment_lease',
  'land_lease',
  'epc',
  'pole_attachment',
  'bill_collection',
  'opgw_lease',
  'current_deposit',
  'edl_app_payment',
  'cooperation',
  'shareholding',
  'pta',
  'moa',
  'other_assigned',
] as const;
export type GcContractType = (typeof GC_CONTRACT_TYPES)[number];

export const GC_STATUSES = ['pending', 'active', 'expiring', 'expired'] as const;
export type GcStatus = (typeof GC_STATUSES)[number];

export const GC_CURRENCIES = ['LAK', 'USD', 'CNY'] as const;

export type GcEquity = { kind: 'percent'; percent: number } | { kind: 'amount'; money: Money };

export interface GeneralContract {
  id: string;
  title: string;
  type: GcContractType;
  contractNo: string;
  counterparty: string | null;
  termText: string | null;
  signedDate: string;
  effectiveDate: string;
  endDate: string | null;
  value: Money | null;
  equity: GcEquity | null;
  implementer: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
