'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useDepartments } from '@/features/lookups';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/number';
import { LegalWizard } from '../../lib/legal-wizard';
import { legalCasesService } from '../api/legal-cases.service';
import { toLegalCasePayload } from '../lib/legal-case-mapper';
import { applyLegalCaseServerError } from '../lib/legal-case-server-errors';
import { emptyLegalCaseForm, legalCaseFormSchema, type LegalCaseFormValues } from '../schemas/legal-case.schema';
import {
  LEGAL_CASE_FIELD_ORDER,
  LegalCaseFormFields,
  firstInvalidLegalCaseFieldId,
  type LegalCaseFieldName,
} from './legal-case-form-fields';

const WC = lo.legal.wizard.cases;
const F = lo.legal.fields;

const STEP_FIELDS: Record<number, readonly LegalCaseFieldName[]> = {
  1: ['caseCode', 'defendant', 'allegation', 'caseType', 'disputeStatus', 'date', 'departmentId', 'departmentAction'],
  2: ['damageLak', 'damageUsd', 'fineLak', 'fineUsd', 'recoveredLak', 'recoveredUsd'],
  3: ['disputeProgress', 'externalUrl'],
};

const money = (n: number | null | undefined): string => (n == null ? '' : formatNumber(n));
const total = (a: number | null | undefined, b: number | null | undefined): string =>
  a == null && b == null ? '' : formatNumber((a ?? 0) + (b ?? 0));

export function LegalCaseWizard() {
  const form = useForm<LegalCaseFormValues>({
    resolver: zodResolver(legalCaseFormSchema),
    defaultValues: emptyLegalCaseForm(),
    shouldFocusError: false,
  });
  const { items: departments } = useDepartments();
  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? '';

  return (
    <LegalWizard<LegalCaseFormValues>
      form={form}
      module="legal-cases"
      accent="litigation"
      title={WC.title}
      stepLabels={[WC.step1, WC.step2, WC.step3]}
      stepFields={STEP_FIELDS}
      fieldOrder={LEGAL_CASE_FIELD_ORDER}
      firstInvalidId={firstInvalidLegalCaseFieldId}
      renderFields={(fields) => <LegalCaseFormFields form={form} fields={fields} />}
      summaryTitle={WC.summary}
      summaryRows={(v) => [
        { label: F.caseCode, value: v.caseCode?.trim() ?? '' },
        { label: F.defendant, value: v.defendant?.trim() ?? '' },
        { label: F.caseType, value: lo.legal.caseTypes[v.caseType] ?? '' },
        { label: F.disputeStatus, value: lo.legal.disputeStatus[v.disputeStatus] ?? '' },
        { label: F.totalDue + ' (LAK)', value: total(v.damageLak, v.fineLak) },
        { label: F.totalDue + ' (USD)', value: total(v.damageUsd, v.fineUsd) },
      ]}
      reviewSections={(v) => [
        {
          step: 1,
          items: [
            { label: F.caseCode, value: v.caseCode ?? '' },
            { label: F.defendant, value: v.defendant ?? '' },
            { label: F.allegation, value: v.allegation ?? '' },
            { label: F.caseType, value: lo.legal.caseTypes[v.caseType] ?? '' },
            { label: F.disputeStatus, value: lo.legal.disputeStatus[v.disputeStatus] ?? '' },
            { label: F.date, value: v.date ? formatDate(v.date) : '' },
            { label: F.department, value: deptName(v.departmentId) },
            { label: F.departmentAction, value: v.departmentAction ?? '' },
          ],
        },
        {
          step: 2,
          items: [
            { label: F.damage + ' (LAK)', value: money(v.damageLak) },
            { label: F.damage + ' (USD)', value: money(v.damageUsd) },
            { label: F.fine + ' (LAK)', value: money(v.fineLak) },
            { label: F.fine + ' (USD)', value: money(v.fineUsd) },
            { label: F.totalDue + ' (LAK)', value: total(v.damageLak, v.fineLak) },
            { label: F.totalDue + ' (USD)', value: total(v.damageUsd, v.fineUsd) },
            { label: F.recovered + ' (LAK)', value: money(v.recoveredLak) },
            { label: F.recovered + ' (USD)', value: money(v.recoveredUsd) },
          ],
        },
        {
          step: 3,
          items: [
            { label: F.disputeProgress, value: v.disputeProgress ?? '' },
            { label: F.externalUrl, value: v.externalUrl || lo.legal.wizard.noLinks },
          ],
        },
      ]}
      submitLabel={WC.submit}
      createdMessage={WC.created}
      create={async (v) => (await legalCasesService.create(toLegalCasePayload(v))).id}
      applyServerError={applyLegalCaseServerError}
      detailHref={(id) => '/legal/cases/' + encodeURIComponent(id)}
    />
  );
}
