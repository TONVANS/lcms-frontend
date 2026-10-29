import type { ContractStatus, ContractTypeOption, Currency } from '@/types/domain';

export const GC_STATUSES: readonly ContractStatus[] = [
  'DRAFT',
  'ACTIVE',
  'EXPIRING_SOON',
  'EXPIRED',
  'TERMINATED',
];

export const GC_CURRENCIES: readonly Currency[] = ['LAK', 'USD', 'CNY'];

export const GC_PAGE_SIZES = [10, 20, 50] as const;

export const GC_DEFAULT_NOTIFY_DAYS = 60;

/** Model of a general contract. Field names follow the backend DTO verbatim (plan Ruling 1). */
export interface Contract {
  id: string;
  title: string;
  contractTypeId: number | null;
  contractType: ContractTypeOption | null;
  contractNumber: string;
  durationText: string | null;
  durationMonths: number | null;
  /** YYYY-MM-DD */
  signedDate: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  contractValue: number | null;
  currency: Currency | null;
  equityOrCapitalContribution: string | null;
  sharePercentage: number | null;
  implementer: string | null;
  additionalDetails: string | null;
  notifyDaysBefore: number | null;
  status: ContractStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ContractsDashboard {
  total: number;
  expiringSoonCount: number;
  expiredCount: number;
  byStatus: { status: ContractStatus; count: number }[];
  byCurrency: { currency: Currency; count: number }[];
  valueByCurrency: { currency: Currency; amount: number }[];
  byContractType: { contractTypeId: number | null; name: string; count: number }[];
}
