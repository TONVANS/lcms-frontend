'use client';

import { useState, type ReactNode } from 'react';
import { AlignLeft, Calendar, Coins, FileText, type LucideIcon } from 'lucide-react';
import { Controller, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { DatePicker } from '@/components/shared/date-picker';
import { MoneyInput } from '@/components/shared/money-input';
import { DOT_TONE_CLASS } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useContractTypes } from '@/features/lookups';
import { STATUS_META } from '@/lib/constants/status';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import type { ContractStatus, Currency } from '@/types/domain';
import type { GcFormValues } from '../schemas/gc.schema';
import { GC_CURRENCIES, GC_STATUSES } from '../types';

export type GcFieldGroup = 'general' | 'dates' | 'money' | 'notes';

export type GcFormFieldName = keyof GcFormValues;

/** Visual order of the fields; the first invalid one receives focus. */
export const GC_FIELD_ORDER: readonly GcFormFieldName[] = [
  'title',
  'contractTypeId',
  'contractNumber',
  'status',
  'signedDate',
  'effectiveDate',
  'expirationDate',
  'durationText',
  'durationMonths',
  'contractValue',
  'currency',
  'equityOrCapitalContribution',
  'sharePercentage',
  'implementer',
  'additionalDetails',
  'notifyDaysBefore',
];

export const gcFieldId = (name: string): string => `gc-field-${name}`;

/** DOM id of the control that should be focused for the first error in `errors`. */
export function firstInvalidFieldId(errors: FieldErrors<GcFormValues>): string | null {
  for (const name of GC_FIELD_ORDER) {
    if (errors[name]) return gcFieldId(name === 'currency' ? 'contractValue' : name);
  }
  return null;
}

const TOKEN_FIELD =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

interface ControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
  'aria-required': boolean | undefined;
}

interface FieldProps {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  wide?: boolean;
  children: (control: ControlProps, labelId: string) => ReactNode;
}

/** One labelled field: visible <label>, gold aria-hidden marker, error linked by aria-describedby. */
function Field({ name, label, required, error, wide, children }: FieldProps) {
  const id = gcFieldId(name);
  const errorId = `${id}-error`;
  const labelId = `${id}-label`;
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', wide && 'col-span-full')}>
      <Label htmlFor={id} id={labelId} className="text-xs text-(--text-secondary)">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-(--gold)">
            *
          </span>
        ) : null}
      </Label>
      {children(
        {
          id,
          'aria-invalid': Boolean(error),
          'aria-describedby': error ? errorId : undefined,
          'aria-required': required ? true : undefined,
        },
        labelId,
      )}
      {error ? (
        <p id={errorId} className="text-xs text-(--text-error)">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const GRID = 'grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4';

/** Raw text is local so "12." and "" survive typing; the form holds NaN while the text is not a number. */
function NumberInput({
  value,
  onChange,
  control,
  decimal,
  onBlur,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  control: ControlProps;
  decimal?: boolean;
  onBlur?: () => void;
}) {
  const [raw, setRaw] = useState(() => (value === null || Number.isNaN(value) ? '' : String(value)));
  return (
    <Input
      {...control}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={raw}
      onBlur={onBlur}
      onChange={(e) => {
        const text = e.target.value;
        setRaw(text);
        const t = text.trim().replace(/,/g, '');
        if (t === '') onChange(null);
        else onChange(/^\d*\.?\d*$/.test(t) && t !== '.' ? Number(t) : Number.NaN);
      }}
    />
  );
}

function msg(err: { message?: string } | undefined): string | undefined {
  return err?.message;
}

export function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-(--border-subtle) bg-white/[0.02] dark:bg-white/[0.015] p-4.5 sm:p-5 shadow-xs">
      <div className="flex items-center gap-2.5 pb-2.5 border-b border-(--border-subtle)">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-(--gc)/25 bg-(--gc)/10 text-(--gc)"
        >
          <Icon className="size-3.5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-(--text-strong)">
            {title}
          </span>
          {description ? (
            <span className="text-[11px] text-(--text-muted)">{description}</span>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function ContractTypeSelect({
  control,
  form,
  error,
}: {
  control: ControlProps;
  form: UseFormReturn<GcFormValues>;
  error?: string;
}) {
  const types = useContractTypes();
  return (
    <>
      <Controller
        control={form.control}
        name="contractTypeId"
        render={({ field }) => (
          <Select
            value={typeof field.value === 'number' && !Number.isNaN(field.value) ? String(field.value) : ''}
            onValueChange={(v) => field.onChange(Number(v))}
          >
            <SelectTrigger
              {...control}
              ref={field.ref}
              onBlur={field.onBlur}
              className={cn('w-full', TOKEN_FIELD)}
            >
              <SelectValue placeholder={lo.gc.form.selectType} />
            </SelectTrigger>
            <SelectContent>
              {types.items.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.nameLo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {types.status === 'error' && !error ? (
        <p className="text-xs text-(--text-error)">{lo.gc.form.typesLoadFailed}</p>
      ) : null}
    </>
  );
}

export function GcFormFieldGroup({
  group,
  form,
}: {
  group: GcFieldGroup;
  form: UseFormReturn<GcFormValues>;
}) {
  const { register, control } = form;
  const errors = form.formState.errors;
  const f = lo.gc.fields;

  if (group === 'general') {
    return (
      <SectionCard icon={FileText} title={lo.gc.form.sectionGeneral} description={lo.gc.form.sectionGeneralDesc}>
        <div className={GRID}>
          <Field name="title" label={f.title} required wide error={msg(errors.title)}>
            {(c) => <Input {...c} {...register('title')} />}
          </Field>
          <Field name="contractTypeId" label={f.contractTypeId} required error={msg(errors.contractTypeId)}>
            {(c) => <ContractTypeSelect control={c} form={form} error={msg(errors.contractTypeId)} />}
          </Field>
          <Field name="contractNumber" label={f.contractNumber} required error={msg(errors.contractNumber)}>
            {(c) => <Input {...c} {...register('contractNumber')} />}
          </Field>
          <Field name="status" label={f.status} error={msg(errors.status)}>
            {(c, labelId) => (
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'DRAFT'}
                    onValueChange={(v) => field.onChange(v as ContractStatus)}
                  >
                    <SelectTrigger
                      {...c}
                      id={c.id}
                      aria-labelledby={`${labelId} ${c.id}`}
                      className={cn('w-full', TOKEN_FIELD)}
                    >
                      <SelectValue placeholder={lo.status.DRAFT} />
                    </SelectTrigger>
                    <SelectContent>
                      {GC_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={cn('size-2 shrink-0 rounded-full', DOT_TONE_CLASS[STATUS_META[s].tone])}
                            />
                            <span>{STATUS_META[s].label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </Field>
        </div>
      </SectionCard>
    );
  }

  if (group === 'dates') {
    const dateField = (name: 'signedDate' | 'effectiveDate' | 'expirationDate', label: string) => (
      <Field name={name} label={label} error={msg(errors[name])}>
        {(c, labelId) => (
          <Controller
            control={control}
            name={name}
            render={({ field }) => (
              <DatePicker
                id={c.id}
                labelId={labelId}
                aria-invalid={c['aria-invalid']}
                aria-describedby={c['aria-describedby']}
                clearable
                value={field.value || null}
                onChange={(v) => {
                  field.onChange(v ?? '');
                  // The order error lives on expirationDate; keep it in step with either date.
                  if (name !== 'signedDate' && form.formState.errors.expirationDate) {
                    void form.trigger('expirationDate');
                  }
                }}
              />
            )}
          />
        )}
      </Field>
    );
    return (
      <SectionCard icon={Calendar} title={lo.gc.form.sectionDates} description={lo.gc.form.sectionDatesDesc}>
        <div className={GRID}>
          {dateField('signedDate', f.signedDate)}
          {dateField('effectiveDate', f.effectiveDate)}
          {dateField('expirationDate', f.expirationDate)}
          <Field name="durationText" label={f.durationText} error={msg(errors.durationText)}>
            {(c) => <Input {...c} {...register('durationText')} />}
          </Field>
          <Field name="durationMonths" label={f.durationMonths} error={msg(errors.durationMonths)}>
            {(c) => (
              <Controller
                control={control}
                name="durationMonths"
                render={({ field }) => (
                  <NumberInput control={c} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            )}
          </Field>
        </div>
      </SectionCard>
    );
  }

  if (group === 'money') {
    return (
      <SectionCard icon={Coins} title={lo.gc.form.sectionMoney} description={lo.gc.form.sectionMoneyDesc}>
        <div className={GRID}>
          <Field
            name="contractValue"
            label={f.contractValue}
            wide
            error={msg(errors.contractValue) ?? msg(errors.currency)}
          >
            {(c) => (
              <Controller
                control={control}
                name="contractValue"
                render={({ field }) => (
                  <MoneyInput
                    id={c.id}
                    aria-invalid={c['aria-invalid']}
                    aria-describedby={c['aria-describedby']}
                    currencies={[...GC_CURRENCIES] as Currency[]}
                    value={
                      field.value === null || Number.isNaN(field.value)
                        ? null
                        : { amount: field.value, currency: form.getValues('currency') ?? 'LAK' }
                    }
                    onChange={(m) => {
                      field.onChange(m ? m.amount : null);
                      form.setValue('currency', m ? (m.currency as Currency) : null, { shouldDirty: true });
                    }}
                  />
                )}
              />
            )}
          </Field>
          <Field
            name="equityOrCapitalContribution"
            label={f.equityOrCapitalContribution}
            error={msg(errors.equityOrCapitalContribution)}
          >
            {(c) => <Input {...c} {...register('equityOrCapitalContribution')} />}
          </Field>
          <Field name="sharePercentage" label={f.sharePercentage} error={msg(errors.sharePercentage)}>
            {(c) => (
              <Controller
                control={control}
                name="sharePercentage"
                render={({ field }) => (
                  <NumberInput
                    decimal
                    control={c}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            )}
          </Field>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard icon={AlignLeft} title={lo.gc.form.sectionNotes} description={lo.gc.form.sectionNotesDesc}>
      <div className={GRID}>
        <Field name="implementer" label={f.implementer} error={msg(errors.implementer)}>
          {(c) => <Input {...c} {...register('implementer')} />}
        </Field>
        <Field name="notifyDaysBefore" label={f.notifyDaysBefore} error={msg(errors.notifyDaysBefore)}>
          {(c) => (
            <Controller
              control={control}
              name="notifyDaysBefore"
              render={({ field }) => (
                <NumberInput
                  control={c}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                />
              )}
            />
          )}
        </Field>
        <Field name="additionalDetails" label={f.additionalDetails} wide error={msg(errors.additionalDetails)}>
          {(c) => <Textarea {...c} rows={3} {...register('additionalDetails')} />}
        </Field>
      </div>
    </SectionCard>
  );
}
