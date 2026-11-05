import type { ContractStatus, Currency } from '@/types/domain';

export type { ContractStatus, Currency };

export const POWER_CONTRACT_TYPES = ['PURCHASE', 'SALE'] as const;
export type PowerContractType = (typeof POWER_CONTRACT_TYPES)[number];

/** 5 standard power purchase project types per specification and Postman collection */
export const POWER_PURCHASE_PROJECT_TYPES = [
  'ໄຟຟ້ານໍ້າຕົກ',
  'ພະລັງງານແສງຕາເວັນ',
  'ພະລັງງານລົມ',
  'ພະລັງງານຄວາມຮ້ອນ / ຖ່ານຫີນ',
  'ພະລັງງານຊີວະມວນ',
] as const;
export type PowerPurchaseProjectType = (typeof POWER_PURCHASE_PROJECT_TYPES)[number];

export const POWER_STATUSES: readonly ContractStatus[] = [
  'DRAFT',
  'ACTIVE',
  'EXPIRING_SOON',
  'EXPIRED',
  'TERMINATED',
];

export const POWER_CAPACITY_UNITS = ['MW', 'kW'] as const;
export type CapacityUnit = (typeof POWER_CAPACITY_UNITS)[number];

export const POWER_CURRENCIES: readonly Currency[] = ['LAK', 'USD', 'CNY'];

export const POWER_PAGE_SIZES = [10, 20, 50] as const;

/** Mapped model of a backend power contract (numbers and dates already coerced). */
export interface PowerContract {
  id: string;
  contractType: PowerContractType;
  contractNumber: string;
  projectName: string;
  projectTypeOrCustomer: string;
  durationText: string | null;
  durationMonths: number | null;
  signedDate: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  installedCapacity: string | null;
  capacityValue: number | null;
  capacityUnit: CapacityUnit | null;
  projectLocation: string | null;
  tariff: string | null;
  tariffValue: number | null;
  tariffCurrency: Currency | null;
  additionalDetails: string | null;
  notifyDaysBefore: number | null;
  status: ContractStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PowerContractsDashboard {
  total: number;
  byStatus: { status: ContractStatus; count: number }[];
  purchaseCount: number;
  saleCount: number;
  totalCapacityMw: number;
  byProjectType: { projectType: string; count: number; capacityMw: number }[];
  expiringSoon: PowerContract[];
}

export interface PowerListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  contractType?: PowerContractType;
  status?: ContractStatus;
  projectTypeOrCustomer?: string;
}
