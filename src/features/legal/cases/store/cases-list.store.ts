import { LEGAL_PAGE_SIZES } from '../../constants';
import { createListStore } from '../../lib/create-list-store';
import { createQueryCodec } from '../../lib/list-query-codec';
import { useListUrlSync } from '../../lib/use-list-url-sync';
import { casesService, type CaseListQuery } from '../api/cases.service';
import {
  CASE_PROGRESS_FILTERS,
  CASE_SORT_KEYS,
  CASE_STAGES,
  CASE_TYPES,
  type LegalCase,
} from '../types';

export const casesQueryCodec = createQueryCodec<CaseListQuery>({
  defaults: { page: 1, pageSize: 10, sort: 'disputeDate', order: 'desc' },
  enums: { caseType: CASE_TYPES, stage: CASE_STAGES, progress: CASE_PROGRESS_FILTERS },
  sortKeys: CASE_SORT_KEYS,
  pageSizes: LEGAL_PAGE_SIZES,
});

export const useCasesListStore = createListStore<LegalCase, CaseListQuery>(
  (q) => casesService.list(q),
  casesQueryCodec.defaults,
);

export function useCasesListUrlSync(): void {
  useListUrlSync(useCasesListStore, casesQueryCodec);
}
