import { DATE_PARAM, DEFAULT_PAGE_SIZE, ID_PARAM, LEGAL_PAGE_SIZES } from '../../constants';
import { createListStore, createQueryCodec, useListUrlSync } from '@/lib/list';


import { legalCasesService, type LegalCaseListQuery } from '../api/legal-cases.service';
import { CASE_TYPES, DISPUTE_STATUSES, type LegalCase } from '../types';

export const legalCasesQueryCodec = createQueryCodec<LegalCaseListQuery>({
  defaults: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  enums: { caseType: CASE_TYPES, disputeStatus: DISPUTE_STATUSES },
  strings: { departmentId: ID_PARAM, startDate: DATE_PARAM, endDate: DATE_PARAM },
  pageSizes: LEGAL_PAGE_SIZES,
});

export const useLegalCasesListStore = createListStore<LegalCase, LegalCaseListQuery>(
  (q) => legalCasesService.list(q),
  legalCasesQueryCodec.defaults,
);

export function useLegalCasesListUrlSync(): void {
  useListUrlSync(useLegalCasesListStore, legalCasesQueryCodec);
}
