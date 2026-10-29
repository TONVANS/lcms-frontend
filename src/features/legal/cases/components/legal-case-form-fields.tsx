'use client';

import { Controller, useWatch, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { DatePicker } from '@/components/shared/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/number';
import { DepartmentField } from '../../lib/department-select';
import { FIELD_GRID, Field, TOKEN_FIELD, fieldDomId } from '../../lib/form-field';
import type { LegalCaseFormValues } from '../schemas/legal-case.schema';
import { CASE_TYPES, DISPUTE_STATUSES } from '../types';
import { AmountPairField } from './amount-pair-field';

export type LegalCaseFieldName = keyof LegalCaseFormValues;

/** Visual order of the fields; the first invalid one receives focus. */
export const LEGAL_CASE_FIELD_ORDER: readonly LegalCaseFieldName[] = [
  'caseCode',
  'defendant',
  'allegation',
  'caseType',
  'disputeStatus',
  'date',
  'departmentId',
  'departmentAction',
  'damageLak',
  'damageUsd',
  'fineLak',
  'fineUsd',
  'recoveredLak',
  'recoveredUsd',
  'disputeProgress',
  'externalUrl',
];

const ID = 'case';
export const legalCaseFieldId = (name: string): string => fieldDomId(ID, name);

const AMOUNT_GROUP: Partial<Record<LegalCaseFieldName, string>> = {
  damageLak: 'damage',
  damageUsd: 'damage',
  fineLak: 'fine',
  fineUsd: 'fine',
  recoveredLak: 'recovered',
  recoveredUsd: 'recovered',
};

export function firstInvalidLegalCaseFieldId(errors: FieldErrors<LegalCaseFormValues>): string | null {
  for (const name of LEGAL_CASE_FIELD_ORDER) {
    if (!errors[name]) continue;
    const group = AMOUNT_GROUP[name];
    if (group) return `${legalCaseFieldId(group)}-${name.endsWith('Lak') ? 'lak' : 'usd'}`;
    return legalCaseFieldId(name);
  }
  return null;
}

export interface LegalCaseFormFieldsProps {
  form: UseFormReturn<LegalCaseFormValues>;
  /** Restrict to a subset (wizard steps); all fields when omitted. */
  fields?: readonly LegalCaseFieldName[];
}

const triggerCls = cn('h-11 w-full rounded-lg border-[rgba(11,27,58,0.14)] bg-(--surface-input) text-sm dark:border-white/14', TOKEN_FIELD);
const inputCls = cn('h-11 rounded-lg border-[rgba(11,27,58,0.14)] bg-(--surface-input) text-sm dark:border-white/14', TOKEN_FIELD);
const areaCls = cn('rounded-lg border-[rgba(11,27,58,0.14)] bg-(--surface-input) text-sm dark:border-white/14', TOKEN_FIELD);

/** All legal-case fields in spec order. Shared by the dialog and the wizard. */
export function LegalCaseFormFields({ form, fields }: LegalCaseFormFieldsProps) {
  const { register, control, setValue } = form;
  const errors = form.formState.errors;
  const f = lo.legal.fields;
  const L = lo.legal.cases.form;
  const watched = useWatch({ control });

  const show = (name: LegalCaseFieldName) => !fields || fields.includes(name);
  const showAmounts = !fields || fields.some((n) => n in AMOUNT_GROUP);
  const msg = (name: LegalCaseFieldName) => errors[name]?.message;

  const sum = (a: number | null | undefined, b: number | null | undefined): string =>
    a == null && b == null ? '—' : formatNumber((a ?? 0) + (b ?? 0));

  const setAmount = (name: LegalCaseFieldName) => (v: number | null) =>
    setValue(name as 'damageLak', v, { shouldDirty: true, shouldValidate: Boolean(errors[name]) });

  const pair = (group: 'damage' | 'fine' | 'recovered', label: string) => {
    const lakKey = `${group}Lak` as LegalCaseFieldName;
    const usdKey = `${group}Usd` as LegalCaseFieldName;
    return (
      <AmountPairField
        id={legalCaseFieldId(group)}
        label={label}
        lak={(watched[lakKey as 'damageLak'] as number | null | undefined) ?? null}
        usd={(watched[usdKey as 'damageUsd'] as number | null | undefined) ?? null}
        onChangeLak={setAmount(lakKey)}
        onChangeUsd={setAmount(usdKey)}
        error={msg(lakKey) || msg(usdKey)}
      />
    );
  };

  return (
    <div className={FIELD_GRID}>
      {show('caseCode') ? (
        <Field idPrefix={ID} name="caseCode" label={f.caseCode} required error={msg('caseCode')}>
          {(c) => <Input {...c} {...register('caseCode')} className={inputCls} />}
        </Field>
      ) : null}

      {show('defendant') ? (
        <Field idPrefix={ID} name="defendant" label={f.defendant} required wide error={msg('defendant')}>
          {(c) => <Input {...c} {...register('defendant')} className={inputCls} />}
        </Field>
      ) : null}

      {show('allegation') ? (
        <Field idPrefix={ID} name="allegation" label={f.allegation} wide error={msg('allegation')}>
          {(c) => <Textarea {...c} rows={3} {...register('allegation')} className={areaCls} />}
        </Field>
      ) : null}

      {show('caseType') ? (
        <Field idPrefix={ID} name="caseType" label={f.caseType} required error={msg('caseType')}>
          {(c, labelId) => (
            <Controller
              control={control}
              name="caseType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={c.id}
                    aria-labelledby={`${labelId} ${c.id}`}
                    aria-invalid={c['aria-invalid']}
                    aria-describedby={c['aria-describedby']}
                    className={triggerCls}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {lo.legal.caseTypes[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>
      ) : null}

      {show('disputeStatus') ? (
        <Field idPrefix={ID} name="disputeStatus" label={f.disputeStatus} required error={msg('disputeStatus')}>
          {(c, labelId) => (
            <Controller
              control={control}
              name="disputeStatus"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={c.id}
                    aria-labelledby={`${labelId} ${c.id}`}
                    aria-invalid={c['aria-invalid']}
                    aria-describedby={c['aria-describedby']}
                    className={triggerCls}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPUTE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {lo.legal.disputeStatus[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>
      ) : null}

      {show('date') ? (
        <Field idPrefix={ID} name="date" label={f.date} required error={msg('date')}>
          {(c, labelId) => (
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  id={c.id}
                  labelId={labelId}
                  required
                  value={field.value || null}
                  onChange={(d) => field.onChange(d ?? '')}
                  aria-invalid={c['aria-invalid']}
                  aria-describedby={c['aria-describedby']}
                />
              )}
            />
          )}
        </Field>
      ) : null}

      {show('departmentId') ? (
        <Field idPrefix={ID} name="departmentId" label={f.department} error={msg('departmentId')}>
          {(c, labelId) => (
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <DepartmentField
                  optional
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

      {show('departmentAction') ? (
        <Field idPrefix={ID} name="departmentAction" label={f.departmentAction} wide error={msg('departmentAction')}>
          {(c) => <Textarea {...c} rows={2} {...register('departmentAction')} className={areaCls} />}
        </Field>
      ) : null}

      {showAmounts ? (
        <div className="col-span-full flex flex-col gap-3 rounded-xl border border-[rgba(11,27,58,0.12)] bg-(--surface-card)/40 p-4 dark:border-white/12">
          <span className="text-xs font-semibold tracking-wide text-(--text-strong)">{L.amountsSection}</span>
          {pair('damage', f.damage)}
          {pair('fine', f.fine)}
          <div
            role="region"
            aria-label={f.totalDue}
            className="flex flex-col gap-2 rounded-lg border border-[rgba(11,27,58,0.1)] bg-(--surface-input)/50 p-3 dark:border-white/10"
          >
            <Label className="text-xs font-semibold text-(--text)">{f.totalDue}</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-md border border-[rgba(11,27,58,0.08)] bg-background/60 px-3 py-2 text-sm dark:border-white/8">
                <span className="text-xs text-(--text-muted)">{f.lak}</span>
                <output className="font-semibold tabular-nums text-(--text)">
                  {sum(watched.damageLak, watched.fineLak)}
                </output>
              </div>
              <div className="flex items-center justify-between rounded-md border border-[rgba(11,27,58,0.08)] bg-background/60 px-3 py-2 text-sm dark:border-white/8">
                <span className="text-xs text-(--text-muted)">{f.usd}</span>
                <output className="font-semibold tabular-nums text-(--text)">
                  {sum(watched.damageUsd, watched.fineUsd)}
                </output>
              </div>
            </div>
          </div>
          {pair('recovered', f.recovered)}
        </div>
      ) : null}

      {show('disputeProgress') ? (
        <Field idPrefix={ID} name="disputeProgress" label={f.disputeProgress} wide error={msg('disputeProgress')}>
          {(c) => <Textarea {...c} rows={3} {...register('disputeProgress')} className={areaCls} />}
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
              className={inputCls}
            />
          )}
        </Field>
      ) : null}
    </div>
  );
}
