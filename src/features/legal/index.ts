export { LEGAL_PAGE_SIZES } from './constants';

// Legal documents (route /legal/regulations)
export {
  DOC_TYPES,
  DOC_STATUSES,
  DOC_STATUS_TONE,
  type DocType,
  type DocStatus,
  type LegalDocument,
  type LegalDocumentPayload,
  type LegalDocumentPatch,
  type LegalDocumentsDashboard,
} from './documents/types';
export {
  legalDocumentsService,
  toLegalDocumentListParams,
  type LegalDocumentListQuery,
} from './documents/api/legal-documents.service';
export {
  toLegalDocument,
  toLegalDocumentPayload,
  diffLegalDocumentPayload,
  toLegalDocumentsDashboard,
} from './documents/lib/legal-document-mapper';
export {
  legalDocumentFormSchema,
  emptyLegalDocumentForm,
  fromLegalDocument,
  type LegalDocumentFormValues,
} from './documents/schemas/legal-document.schema';
export {
  legalDocumentsQueryCodec,
  useLegalDocumentsListStore,
  useLegalDocumentsListUrlSync,
} from './documents/store/legal-documents-list.store';
export { buildLegalDocumentsCsv } from './documents/lib/legal-documents-csv';
export { LegalDocumentsView } from './documents/components/legal-documents-view';
export { LegalDocumentDetailView } from './documents/components/legal-document-detail-view';
export {
  LegalDocumentFormDialog,
  type LegalDocumentFormDialogProps,
} from './documents/components/legal-document-form-dialog';
export { LegalDocumentFormFields } from './documents/components/legal-document-form-fields';
export { LegalDocumentWizard } from './documents/components/legal-document-wizard';
export { LegalDocumentsDashboardSection } from './documents/components/legal-documents-dashboard-section';

// Legal cases (route /legal/cases)
export {
  CASE_TYPES,
  DISPUTE_STATUSES,
  DISPUTE_STATUS_TONE,
  type CaseType,
  type DisputeStatus,
  type LegalCase,
  type LegalCasePayload,
  type LegalCasePatch,
  type LegalCasesDashboard,
  type MoneyTotals,
} from './cases/types';
export {
  legalCasesService,
  toLegalCaseListParams,
  type LegalCaseListQuery,
} from './cases/api/legal-cases.service';
export {
  toLegalCase,
  toLegalCasePayload,
  diffLegalCasePayload,
  toLegalCasesDashboard,
  caseTotalDue,
  isCaseFinished,
} from './cases/lib/legal-case-mapper';
export {
  legalCaseFormSchema,
  emptyLegalCaseForm,
  fromLegalCase,
  type LegalCaseFormValues,
} from './cases/schemas/legal-case.schema';
export {
  legalCasesQueryCodec,
  useLegalCasesListStore,
  useLegalCasesListUrlSync,
} from './cases/store/legal-cases-list.store';
export { buildLegalCasesCsv } from './cases/lib/legal-cases-csv';
export { LegalCasesView } from './cases/components/legal-cases-view';
export { LegalCaseDetailView } from './cases/components/legal-case-detail-view';
export { LegalCaseFormDialog, type LegalCaseFormDialogProps } from './cases/components/legal-case-form-dialog';
export { LegalCaseFormFields } from './cases/components/legal-case-form-fields';
export { LegalCaseWizard } from './cases/components/legal-case-wizard';
export { LegalCasesDashboardSection } from './cases/components/legal-cases-dashboard-section';

// Shared



export { LegalSearch, type LegalSearchProps } from './lib/legal-search';
export { uploadStaged } from './lib/upload-staged';
export { LegalDashboardView } from './dashboard/components/legal-dashboard-view';
export { LegalNewView } from './components/legal-new-view';
