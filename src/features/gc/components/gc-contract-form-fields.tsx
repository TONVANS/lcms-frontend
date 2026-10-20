'use client';

import { useState, type ReactNode } from 'react';
import { Controller, useController, useWatch, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/shared/date-picker';
import { MoneyInput } from '@/components/shared/money-input';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { suggestTermText } from '../lib/term';
import type { GcFormValues } from '../schemas/gc.schema';
import { GC_CONTRACT_TYPES, GC_CURRENCIES, type GcContractType } from '../types';

export type GcFieldGroup = 'general' | 'dates' | 'money' | 'notes';

export type GcFormFieldName = keyof GcFormValues;

/** Visual order of the fields; the first invalid one receives focus. */
export const GC_FIELD_ORDER: readonly GcFormFieldName[] = [
  'title',
  'type',
  'contractNo',
  'counterparty',
  'implementer',
  'signedDate',
  'effectiveDate',
  'endDate',
  'termText',
  'value',
  'equity',
  'notes',
];

export const gcFieldId = (name: string): string => `gc-field-${name}`;

interface EquityErrors {
  message?: string;
  percent?: { message?: string };
  money?: { message?: string; amount?: { message?: string }; currency?: { message?: string } };
}

/** DOM id of the control that should be focused for the first error in `errors`. */
export function firstInvalidFieldId(errors: FieldErrors<GcFormValues>): string | null {
  for (const name of GC_FIELD_ORDER) {
    const err = errors[name];
    if (!err) continue;
    if (name === 'equity') {
      const eq = err as EquityErrors;
      if (eq.percent) return gcFieldId('equity-percent');
      if (eq.money) return gcFieldId('equity-amount');
      return gcFieldId('equity-kind-none');
    }
    return gcFieldId(name);
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
function PercentInput({
  value,
  onChange,
  control,
}: {
  value: number;
  onChange: (v: number) => void;
  control: ControlProps;
}) {
  const [raw, setRaw] = useState(() => (Number.isFinite(value) ? String(value) : ''));
  return (
    <Input
      {...control}
      type="text"
      inputMode="decimal"
      value={raw}
      onChange={(e) => {
        const text = e.target.value;
        setRaw(text);
        const t = text.trim();
        onChange(t !== '' && /^\d*\.?\d*$/.test(t) && t !== '.' ? Number(t) : Number.NaN);
      }}
    />
  );
}

type EquityKind = 'none' | 'percent' | 'amount';

function EquityField({ form }: { form: UseFormReturn<GcFormValues> }) {
  const { field } = useController({ control: form.control, name: 'equity' });
  const equity = field.value;
  const kind: EquityKind = equity === null ? 'none' : equity.kind;
  const errors = form.formState.errors.equity as EquityErrors | undefined;
  const base = gcFieldId('equity');
  const labelId = `${base}-label`;
  const groupError = errors?.message;
  const percentError = errors?.percent?.message;
  const moneyError = errors?.money?.amount?.message ?? errors?.money?.currency?.message ?? errors?.money?.message;
  const describedBy = groupError ? `${base}-error` : undefined;

  const setKind = (next: string) => {
    form.clearErrors('equity');
    if (next === 'none') field.onChange(null);
    else if (next === 'percent') field.onChange({ kind: 'percent', percent: Number.NaN });
    else
      field.onChange({ kind: 'amount', money: { amount: Number.NaN, currency: GC_CURRENCIES[0] } });
  };

  const option = (value: EquityKind, label: string) => (
    <div key={value} className="flex items-center gap-2">
      <RadioGroupItem value={value} id={gcFieldId(`equity-kind-${value}`)} />
      <Label htmlFor={gcFieldId(`equity-kind-${value}`)} className="text-sm">
        {label}
      </Label>
    </div>
  );

  return (
    <div className="col-span-full flex flex-col gap-3">
      <span id={labelId} className="text-xs leading-none font-medium text-(--text-secondary)">
        {lo.gc.fields.equity}
      </span>
      <RadioGroup
        value={kind}
        onValueChange={setKind}
        aria-labelledby={labelId}
        aria-invalid={Boolean(groupError)}
        aria-describedby={describedBy}
        className="flex flex-wrap gap-x-6 gap-y-2"
      >
        {option('none', lo.gc.form.equityNone)}
        {option('percent', lo.gc.equityKind.percent)}
        {option('amount', lo.gc.equityKind.amount)}
      </RadioGroup>
      {groupError ? (
        <p id={`${base}-error`} className="text-xs text-(--text-error)">
          {groupError}
        </p>
      ) : null}
      {equity?.kind === 'percent' ? (
        <Field name="equity-percent" label={lo.gc.form.percentInput} required error={percentError}>
          {(control) => (
            <PercentInput
              control={control}
              value={equity.percent}
              onChange={(percent) => field.onChange({ kind: 'percent', percent })}
            />
          )}
        </Field>
      ) : null}
      {equity?.kind === 'amount' ? (
        <Field name="equity-amount" label={lo.money.amount} required error={moneyError}>
          {(control) => (
            <MoneyInput
              id={control.id}
              aria-invalid={control['aria-invalid']}
              aria-describedby={control['aria-describedby']}
              aria-required={control['aria-required']}
              currencies={[...GC_CURRENCIES]}
              value={Number.isFinite(equity.money.amount) ? equity.money : null}
              onChange={(m) =>
                field.onChange({
                  kind: 'amount',
                  money: m ?? { amount: Number.NaN, currency: equity.money.currency },
                })
              }
            />
          )}
        </Field>
      ) : null}
    </div>
  );
}

function TermSuggestion({ form }: { form: UseFormReturn<GcFormValues> }) {
  const effective = useWatch({ control: form.control, name: 'effectiveDate' });
  const end = useWatch({ control: form.control, name: 'endDate' });
  const termText = useWatch({ control: form.control, name: 'termText' });
  const suggestion = effective && end ? suggestTermText(effective, end) : '';
  if (!suggestion || suggestion === termText.trim()) return null;
  return (
    <div className="col-span-full flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
      <span>{lo.gc.form.suggestTerm(suggestion)}</span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => form.setValue('termText', suggestion, { shouldDirty: true })}
      >
        {lo.gc.form.useSuggestion}
      </Button>
    </div>
  );
}

function msg(err: { message?: string } | undefined): string | undefined {
  return err?.message;
}

export function GcFormFieldGroup({ group, form }: { group: GcFieldGroup; form: UseFormReturn<GcFormValues> }) {
  const { register, control } = form;
  const errors = form.formState.errors;
  const f = lo.gc.fields;

  if (group === 'general') {
    return (
      <div className={GRID}>
        <Field name="title" label={f.title} required wide error={msg(errors.title)}>
          {(c) => <Input {...c} {...register('title')} />}
        </Field>
        <Field name="type" label={f.type} required error={msg(errors.type)}>
          {(c) => (
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    {...c}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    className={cn('w-full', TOKEN_FIELD)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GC_CONTRACT_TYPES.map((t: GcContractType) => (
                      <SelectItem key={t} value={t}>
                        {lo.gc.types[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>
        <Field name="contractNo" label={f.contractNo} required error={msg(errors.contractNo)}>
          {(c) => <Input {...c} {...register('contractNo')} />}
        </Field>
        <Field name="counterparty" label={f.counterparty} error={msg(errors.counterparty)}>
          {(c) => <Input {...c} {...register('counterparty')} />}
        </Field>
        <Field name="implementer" label={f.implementer} error={msg(errors.implementer)}>
          {(c) => <Input {...c} {...register('implementer')} />}
        </Field>
      </div>
    );
  }

  if (group === 'dates') {
    const dateField = (
      name: 'signedDate' | 'effectiveDate' | 'endDate',
      label: string,
      required: boolean,
    ) => (
      <Field name={name} label={label} required={required} error={msg(errors[name])}>
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
                required={required}
                clearable={name === 'endDate'}
                value={field.value || null}
                onChange={(v) => {
                  field.onChange(name === 'endDate' ? v : (v ?? ''));
                  // The order error lives on endDate; keep it in step with either date.
                  if (name !== 'signedDate' && form.formState.errors.endDate) void form.trigger('endDate');
                }}
              />
            )}
          />
        )}
      </Field>
    );
    return (
      <div className={GRID}>
        {dateField('signedDate', f.signedDate, true)}
        {dateField('effectiveDate', f.effectiveDate, true)}
        {dateField('endDate', f.endDate, false)}
        <Field name="termText" label={f.termText} error={msg(errors.termText)}>
          {(c) => <Input {...c} {...register('termText')} />}
        </Field>
        <TermSuggestion form={form} />
      </div>
    );
  }

  if (group === 'money') {
    const valueErr = errors.value as EquityErrors['money'];
    return (
      <div className={GRID}>
        <Field
          name="value"
          label={f.value}
          wide
          error={valueErr?.amount?.message ?? valueErr?.currency?.message ?? valueErr?.message}
        >
          {(c) => (
            <Controller
              control={control}
              name="value"
              render={({ field }) => (
                <MoneyInput
                  id={c.id}
                  aria-invalid={c['aria-invalid']}
                  aria-describedby={c['aria-describedby']}
                  currencies={[...GC_CURRENCIES]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          )}
        </Field>
        <EquityField form={form} />
      </div>
    );
  }

  return (
    <div className={GRID}>
      <Field name="notes" label={f.notes} wide error={msg(errors.notes)}>
        {(c) => <Textarea {...c} rows={3} {...register('notes')} />}
      </Field>
    </div>
  );
}
