import { LEGAL_PAGE_SIZES, LEGAL_UNITS } from '../../constants';
import { createListStore } from '../../lib/create-list-store';
import { createQueryCodec } from '../../lib/list-query-codec';
import { useListUrlSync } from '../../lib/use-list-url-sync';
import { regulationsService, type RegulationListQuery } from '../api/regulations.service';
import { REGULATION_SORT_KEYS, REGULATION_STATUSES, REGULATION_TYPES } from '../types';
import type { Regulation } from '../types';

export const regulationsQueryCodec = createQueryCodec<RegulationListQuery>({
  defaults: { page: 1, pageSize: 10, sort: 'issuedDate', order: 'desc' },
  enums: { type: REGULATION_TYPES, unit: LEGAL_UNITS, status: REGULATION_STATUSES },
  sortKeys: REGULATION_SORT_KEYS,
  pageSizes: LEGAL_PAGE_SIZES,
});

export const useRegulationsListStore = createListStore<Regulation, RegulationListQuery>(
  (q) => regulationsService.list(q),
  regulationsQueryCodec.defaults,
);

export function useRegulationsListUrlSync(): void {
  useListUrlSync(useRegulationsListStore, regulationsQueryCodec);
}
