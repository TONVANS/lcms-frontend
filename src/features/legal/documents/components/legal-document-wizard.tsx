'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { lo } from '@/lib/i18n/lo';
import { LegalWizard } from '../../lib/legal-wizard';
import { legalDocumentsService } from '../api/legal-documents.service';
import { toLegalDocumentPayload } from '../lib/legal-document-mapper';
import {
  emptyLegalDocumentForm,
  legalDocumentFormSchema,
  type LegalDocumentFormValues,
} from '../schemas/legal-document.schema';
import {
  LEGAL_DOCUMENT_FIELD_ORDER,
  LegalDocumentFormFields,
  firstInvalidLegalDocumentFieldId,
  type LegalDocumentFieldName,
} from './legal-document-form-fields';
import { useDepartments } from '@/features/lookups';

const WR = lo.legal.wizard.regulations;
const F = lo.legal.fields;

const STEP_FIELDS: Record<number, readonly LegalDocumentFieldName[]> = {
  1: ['docTitle', 'docType', 'issueYear', 'docNumberDate'],
  2: ['departmentId', 'responsiblePerson', 'status', 'purpose'],
  3: ['externalUrl'],
};

export function LegalDocumentWizard() {
  const form = useForm<LegalDocumentFormValues>({
    resolver: zodResolver(legalDocumentFormSchema),
    defaultValues: emptyLegalDocumentForm(),
    shouldFocusError: false,
  });
  const { items: departments } = useDepartments();
  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? '';

  return (
    <LegalWizard<LegalDocumentFormValues>
      form={form}
      module="legal-documents"
      title={WR.title}
      stepLabels={[WR.step1, WR.step2, WR.step3]}
      stepFields={STEP_FIELDS}
      fieldOrder={LEGAL_DOCUMENT_FIELD_ORDER}
      firstInvalidId={firstInvalidLegalDocumentFieldId}
      renderFields={(fields) => <LegalDocumentFormFields form={form} fields={fields} />}
      summaryTitle={WR.summary}
      summaryRows={(v) => [
        { label: F.docTitle, value: v.docTitle?.trim() ?? '' },
        { label: F.docType, value: lo.legal.docTypes[v.docType] ?? '' },
        { label: F.docNumberDate, value: v.docNumberDate?.trim() ?? '' },
        { label: F.issueYear, value: v.issueYear?.trim() ?? '' },
        { label: F.department, value: deptName(v.departmentId) },
        { label: F.status, value: lo.legal.docStatus[v.status] ?? '' },
      ]}
      reviewSections={(v) => [
        {
          step: 1,
          items: [
            { label: F.docTitle, value: v.docTitle ?? '' },
            { label: F.docType, value: lo.legal.docTypes[v.docType] ?? '' },
            { label: F.issueYear, value: v.issueYear ?? '' },
            { label: F.docNumberDate, value: v.docNumberDate ?? '' },
          ],
        },
        {
          step: 2,
          items: [
            { label: F.department, value: deptName(v.departmentId) },
            { label: F.responsiblePerson, value: v.responsiblePerson ?? '' },
            { label: F.status, value: lo.legal.docStatus[v.status] ?? '' },
            { label: F.purpose, value: v.purpose ?? '' },
          ],
        },
        { step: 3, items: [{ label: F.externalUrl, value: v.externalUrl || lo.legal.wizard.noLinks }] },
      ]}
      submitLabel={WR.submit}
      createdMessage={WR.created}
      create={async (v) => (await legalDocumentsService.create(toLegalDocumentPayload(v))).id}
      applyServerError={() => null}
      detailHref={(id) => `/legal/regulations/${encodeURIComponent(id)}`}
    />
  );
}
