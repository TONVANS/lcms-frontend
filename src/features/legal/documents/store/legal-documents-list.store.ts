import { DEFAULT_PAGE_SIZE, ID_PARAM, LEGAL_PAGE_SIZES } from '../../constants';
import { createListStore } from '../../lib/create-list-store';
import { createQueryCodec } from '../../lib/list-query-codec';
import { useListUrlSync } from '../../lib/use-list-url-sync';
import { legalDocumentsService, type LegalDocumentListQuery } from '../api/legal-documents.service';
import { DOC_STATUSES, DOC_TYPES, type LegalDocument } from '../types';

export const legalDocumentsQueryCodec = createQueryCodec<LegalDocumentListQuery>({
  defaults: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  enums: { docType: DOC_TYPES, status: DOC_STATUSES },
  ints: ['issueYear'],
  strings: { departmentId: ID_PARAM },
  pageSizes: LEGAL_PAGE_SIZES,
});

export const useLegalDocumentsListStore = createListStore<LegalDocument, LegalDocumentListQuery>(
  (q) => legalDocumentsService.list(q),
  legalDocumentsQueryCodec.defaults,
);

export function useLegalDocumentsListUrlSync(): void {
  useListUrlSync(useLegalDocumentsListStore, legalDocumentsQueryCodec);
}
