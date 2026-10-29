'use client';

import { Controller, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { DepartmentField } from '../../lib/department-select';
import { FIELD_GRID, Field, TOKEN_FIELD, fieldDomId } from '../../lib/form-field';
import type { LegalDocumentFormValues } from '../schemas/legal-document.schema';
import { DOC_STATUSES, DOC_TYPES } from '../types';

export type LegalDocumentFieldName = keyof LegalDocumentFormValues;

/** Visual order of the fields; the first invalid one receives focus. */
export const LEGAL_DOCUMENT_FIELD_ORDER: readonly LegalDocumentFieldName[] = [
  'docTitle',
  'docType',
  'issueYear',
  'docNumberDate',
  'departmentId',
  'responsiblePerson',
  'status',
  'purpose',
  'externalUrl',
];

const ID = 'doc';
export const legalDocumentFieldId = (name: string): string => fieldDomId(ID, name);

export function firstInvalidLegalDocumentFieldId(
  errors: FieldErrors<LegalDocumentFormValues>,
): string | null {
  const first = LEGAL_DOCUMENT_FIELD_ORDER.find((n) => errors[n]);
  return first ? legalDocumentFieldId(first) : null;
}

export interface LegalDocumentFormFieldsProps {
  form: UseFormReturn<LegalDocumentFormValues>;
  /** Restrict to a subset (wizard steps); all fields when omitted. */
  fields?: readonly LegalDocumentFieldName[];
}

/** All legal-document fields in spec order. Shared by the dialog and the wizard. */
export function LegalDocumentFormFields({ form, fields }: LegalDocumentFormFieldsProps) {
  const { register, control } = form;
  const errors = form.formState.errors;
  const f = lo.legal.fields;
  const show = (name: LegalDocumentFieldName) => !fields || fields.includes(name);
  const msg = (name: LegalDocumentFieldName) => errors[name]?.message;

  return (
    <div className={FIELD_GRID}>
      {show('docTitle') ? (
        <Field idPrefix={ID} name="docTitle" label={f.docTitle} required wide error={msg('docTitle')}>
          {(c) => <Input {...c} {...register('docTitle')} />}
        </Field>
      ) : null}

      {show('docType') ? (
        <Field idPrefix={ID} name="docType" label={f.docType} required error={msg('docType')}>
          {(c, labelId) => (
            <Controller
              control={control}
              name="docType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={c.id}
                    aria-labelledby={`${labelId} ${c.id}`}
                    aria-invalid={c['aria-invalid']}
                    aria-describedby={c['aria-describedby']}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    className={cn('w-full', TOKEN_FIELD)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {lo.legal.docTypes[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>
      ) : null}

      {show('issueYear') ? (
        <Field idPrefix={ID} name="issueYear" label={f.issueYear} required error={msg('issueYear')}>
          {(c) => <Input {...c} inputMode="numeric" maxLength={4} {...register('issueYear')} />}
        </Field>
      ) : null}

      {show('docNumberDate') ? (
        <Field idPrefix={ID} name="docNumberDate" label={f.docNumberDate} required wide error={msg('docNumberDate')}>
          {(c) => <Input {...c} {...register('docNumberDate')} />}
        </Field>
      ) : null}

      {show('departmentId') ? (
        <Field idPrefix={ID} name="departmentId" label={f.department} required error={msg('departmentId')}>
          {(c, labelId) => (
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <DepartmentField
                  control={c}
                  labelId={labelId}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          )}
        </Field>
      ) : null}

      {show('responsiblePerson') ? (
        <Field idPrefix={ID} name="responsiblePerson" label={f.responsiblePerson} error={msg('responsiblePerson')}>
          {(c) => <Input {...c} {...register('responsiblePerson')} />}
        </Field>
      ) : null}

      {show('status') ? (
        <Field idPrefix={ID} name="status" label={f.status} required error={msg('status')}>
          {(c, labelId) => (
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={c.id}
                    aria-labelledby={`${labelId} ${c.id}`}
                    aria-invalid={c['aria-invalid']}
                    aria-describedby={c['aria-describedby']}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    className={cn('w-full', TOKEN_FIELD)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {lo.legal.docStatus[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>
      ) : null}

      {show('purpose') ? (
        <Field idPrefix={ID} name="purpose" label={f.purpose} wide error={msg('purpose')}>
          {(c) => <Textarea {...c} rows={3} {...register('purpose')} />}
        </Field>
      ) : null}

      {show('externalUrl') ? (
        <Field idPrefix={ID} name="externalUrl" label={f.externalUrl} wide error={msg('externalUrl')}>
          {(c) => (
            <Input
              {...c}
              type="url"
              inputMode="url"
              placeholder={lo.legal.regulations.form.urlPlaceholder}
              {...register('externalUrl')}
            />
          )}
        </Field>
      ) : null}
    </div>
  );
}
