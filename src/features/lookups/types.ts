import type { ContractTypeOption, Department } from '@/types/domain';

export type { ContractTypeOption, Department };

export type LookupKey = 'departments' | 'contractTypes' | 'projectTypes';
export type LookupStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface LookupResult<T> {
  items: T[];
  status: LookupStatus;
  error: string | null;
  reload: () => void;
}
