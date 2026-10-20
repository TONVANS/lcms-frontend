import type { Alert, ContractStatus, EnergyType, KeyEvent } from '@/types/domain';

export type { EnergyType, ContractStatus, KeyEvent };

export interface PpaDeveloper {
  id: string;
  name: string;
}

export interface PpaContract {
  id: string;
  contractNo: string;
  projectName: string;
  developer: PpaDeveloper;
  energyType: EnergyType;
  capacityMw: number;
  tariffUsCentPerKwh: number;
  annualEnergyGwh?: number | null;
  market: 'domestic' | 'export';
  signedDate?: string;
  codDate?: string;
  endDate?: string;
  termYears?: number;
  status: ContractStatus;
  ownerUserId: string;
  nextEvent?: KeyEvent;
  alertDays: number[];
  notes?: string;
}

export interface PpaContractInput {
  contractNo: string;
  projectName: string;
  developerName: string;
  energyType: EnergyType;
  capacityMw: number;
  tariffUsCentPerKwh: number;
  annualEnergyGwh?: number | null;
  market: 'domestic' | 'export';
  signedDate?: string;
  codDate?: string;
  endDate?: string;
  termYears?: number;
  status?: ContractStatus;
  alertDays?: number[];
  notes?: string;
}

export interface PpaDashboardSummary {
  kpis: {
    totalContracts: number;
    activeCapacityMw: number;
    expiringCount: number;
    avgTariff: number;
  };
  energyBreakdown: Array<{
    energyType: EnergyType;
    label: string;
    count: number;
    capacityMw: number;
    percentage: number;
  }>;
  statusBreakdown: Array<{
    status: ContractStatus;
    count: number;
  }>;
  monthlyExpiring: Array<{
    month: string;
    count: number;
  }>;
  upcomingAlerts: Alert[];
}

export interface PpaFilterState {
  q: string;
  status: string;
  energyType: string;
  market: string;
  page: number;
  pageSize: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
