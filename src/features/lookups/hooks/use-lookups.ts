'use client';

import { useCallback, useEffect } from 'react';
import type { ContractTypeOption, Department } from '@/types/domain';
import { useLookupsStore } from '../store/lookups.store';
import type { LookupKey, LookupResult } from '../types';

function useLookup<T>(key: LookupKey): LookupResult<T> {
  const entry = useLookupsStore((s) => s[key]) as { items: T[]; status: LookupResult<T>['status']; error: string | null };
  const load = useLookupsStore((s) => s.load);

  useEffect(() => {
    void load(key);
  }, [key, load]);

  const reload = useCallback(() => {
    void load(key, true);
  }, [key, load]);

  return { items: entry.items, status: entry.status, error: entry.error, reload };
}

export const useDepartments = (): LookupResult<Department> => useLookup<Department>('departments');
export const useContractTypes = (): LookupResult<ContractTypeOption> =>
  useLookup<ContractTypeOption>('contractTypes');
export const useProjectTypes = (): LookupResult<string> => useLookup<string>('projectTypes');
