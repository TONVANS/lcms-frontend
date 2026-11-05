'use client';

import { AlignLeft, Calendar, FileText, Zap, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Controller, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { DatePicker } from '@/components/shared/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useProjectTypes } from '@/features/lookups';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import {
  calculateMonthsDiff,
  composeInstalledCapacity,
  composeTariff,
  durationTextToMonths,
  monthsToDurationText,
} from '../lib/format';
import type { PowerFormField, PowerFormValues } from '../schemas/ppa.schema';
import { STATUS_META } from '@/lib/constants/status';
import { DOT_TONE_CLASS } from '@/components/shared/status-badge';
import type { ContractStatus } from '@/types/domain';
import {
  POWER_CAPACITY_UNITS,
  POWER_CONTRACT_TYPES,
  POWER_CURRENCIES,
  POWER_PURCHASE_PROJECT_TYPES,
  POWER_STATUSES,
  type PowerContractType,
} from '../types';

export type PpaFieldGroup = 'general' | 'dates' | 'tech' | 'notes';

/** Visual order of the fields; the first invalid one receives focus. */
export const PPA_FIELD_ORDER: readonly PowerFormField[] = [
  'contractType',
  'contractNumber',
  'projectName',
  'projectTypeOrCustomer',
  'projectLocation',
  'status',
  'durationText',
  'durationMonths',
  'signedDate',
  'effectiveDate',
  'expirationDate',
  'notifyDaysBefore',
  'capacityValue',
  'capacityUnit',
  'tariffValue',
  'tariffCurrency',
  'installedCapacity',
  'tariff',
  'additionalDetails',
];

export const ppaFieldId = (name: string): string => `ppa-field-${name}`;

/** DOM id of the control to focus for the first error in `errors`. */
export function firstInvalidFieldId(errors: FieldErrors<PowerFormValues>): string | null {
  const first = PPA_FIELD_ORDER.find((n) => errors[n]);
  if (!first) return null;
  return first === 'contractType' ? ppaFieldId('contractType-PURCHASE') : ppaFieldId(first);
}

/**
 * PURCHASE contracts must use one of the loaded project types (or standard 5 project types).
 * Skipped while the list is not loaded and for an unchanged legacy value.
 */
export function projectTypeIssue(
  values: PowerFormValues,
  types: readonly string[],
  ready: boolean,
  initial: string,
): string | null {
  if (values.contractType !== 'PURCHASE') return null;
  const v = values.projectTypeOrCustomer.trim();
  if (!v || v === initial) return null;
  const allowed = types.length > 0 ? types : POWER_PURCHASE_PROJECT_TYPES;
  if ((allowed as readonly string[]).includes(v)) return null;
  return lo.ppa.validation.projectTypeNotInList;
}

const FOCUS =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

interface ControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
  'aria-required': boolean | undefined;
}

function Field({
  name,
  label,
  required,
  error,
  wide,
  hint,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  wide?: boolean;
  hint?: string;
  children: (control: ControlProps, labelId: string) => ReactNode;
}) {
  const id = ppaFieldId(name);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const labelId = `${id}-label`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
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
          'aria-describedby': describedBy,
          'aria-required': required ? true : undefined,
        },
        labelId,
      )}
      {hint ? (
        <p id={hintId} className="text-[11px] text-(--text-muted)">
          {hint}
        </p>
      ) : null}
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
  nullable,
  placeholder,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  control: ControlProps;
  nullable: boolean;
  placeholder?: string;
}) {
  const [raw, setRaw] = useState(() => (value === null || !Number.isFinite(value) ? '' : String(value)));
  const [prevValue, setPrevValue] = useState(value);

  // If value was changed from OUTSIDE this component (e.g. form reset or auto-calc), sync raw text.
  if (!Object.is(value, prevValue)) {
    setPrevValue(value);
    const synced = value === null || !Number.isFinite(value) ? '' : String(value);
    if (synced !== raw) {
      setRaw(synced);
    }
  }

  return (
    <Input
      {...control}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={raw}
      onChange={(e) => {
        const text = e.target.value;
        setRaw(text);
        const t = text.trim();
        const cleaned = t.replace(/,/g, '');
        let next: number | null;
        if (cleaned === '') {
          next = nullable ? null : Number.NaN;
        } else if (/^-?\d*\.?\d*$/.test(cleaned) && cleaned !== '.' && cleaned !== '-') {
          next = Number(cleaned);
        } else {
          next = Number.NaN;
        }
        setPrevValue(next);
        onChange(next);
      }}
    />
  );
}

export function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-(--border-subtle) bg-white/[0.02] p-4.5 shadow-xs sm:p-5 dark:bg-white/[0.015]">
      <div className="flex items-center gap-2.5 border-b border-(--border-subtle) pb-2.5">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-(--ppa)/25 bg-(--ppa)/10 text-(--ppa)"
        >
          <Icon className="size-3.5" />
        </span>
        <span className="text-xs font-semibold tracking-wider text-(--text-strong) uppercase">{title}</span>
      </div>
      {children}
    </div>
  );
}

const msg = (err: { message?: string } | undefined): string | undefined => err?.message;

/** PURCHASE -> select of the 5 project types; SALE -> free text customer name (FRONTEND_API_SUMMARY 4.1). */
function ProjectTypeOrCustomerField({ form }: { form: UseFormReturn<PowerFormValues> }) {
  const { register, control, formState, watch } = form;
  const contractType = watch('contractType');
  const types = useProjectTypes();
  const error = msg(formState.errors.projectTypeOrCustomer);

  if (contractType === 'SALE') {
    return (
      <Field
        name="projectTypeOrCustomer"
        label={lo.ppa.fields.customer}
        required
        error={error}
        hint={lo.ppa.form.customerHint}
      >
        {(c) => (
          <Input
            {...c}
            placeholder={lo.ppa.placeholders.customerSale}
            {...register('projectTypeOrCustomer')}
          />
        )}
      </Field>
    );
  }

  const options: readonly string[] = types.items.length > 0 ? types.items : POWER_PURCHASE_PROJECT_TYPES;
  return (
    <Field
      name="projectTypeOrCustomer"
      label={lo.ppa.fields.projectType}
      required
      error={error ?? (types.status === 'error' && types.items.length === 0 ? lo.ppa.form.projectTypesError : undefined)}
      hint={lo.ppa.form.projectTypeHint}
    >
      {(c) => (
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="projectTypeOrCustomer"
            render={({ field }) => {
              const extra = field.value && !options.includes(field.value) ? [field.value] : [];
              return (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger
                    {...c}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    disabled={types.status === 'loading' && options.length === 0}
                    className={cn('w-full', FOCUS)}
                  >
                    <SelectValue
                      placeholder={
                        types.status === 'loading' && options.length === 0
                          ? lo.ppa.form.projectTypesLoading
                          : lo.ppa.placeholders.selectProjectType
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {[...options, ...extra].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
          {types.status === 'error' && types.items.length === 0 ? (
            <Button type="button" variant="secondary" size="sm" onClick={types.reload}>
              {lo.common.retry}
            </Button>
          ) : null}
        </div>
      )}
    </Field>
  );
}

function EnumOptions<T extends string>({ options }: { options: readonly T[] }) {
  return (
    <SelectContent>
      {options.map((o) => (
        <SelectItem key={o} value={o}>
          {o}
        </SelectItem>
      ))}
    </SelectContent>
  );
}

export function PpaFormFieldGroup({
  group,
  form,
}: {
  group: PpaFieldGroup;
  form: UseFormReturn<PowerFormValues>;
}) {
  const { register, control, watch } = form;
  const errors = form.formState.errors;
  const f = lo.ppa.fields;
  const contractType = watch('contractType');
  const isSale = contractType === 'SALE';

  if (group === 'general') {
    return (
      <SectionCard icon={FileText} title={lo.ppa.form.sectionGeneral}>
        <div className={GRID}>
          <Controller
            control={control}
            name="contractType"
            render={({ field }) => (
              <div className="col-span-full flex flex-col gap-2">
                <span id={ppaFieldId('contractType-label')} className="text-xs font-medium text-(--text-secondary)">
                  {f.contractType}
                  <span aria-hidden="true" className="text-(--gold)">
                    *
                  </span>
                </span>
                <RadioGroup
                  value={field.value}
                  onValueChange={(next: PowerContractType) => {
                    if (next === field.value) return;
                    field.onChange(next);
                    // The field changes meaning with the type (select vs text), so never carry a value over.
                    form.setValue('projectTypeOrCustomer', '', { shouldDirty: true });
                    form.clearErrors('projectTypeOrCustomer');
                    // Automatically adjust default currency for the contract type
                    const currentCur = form.getValues('tariffCurrency');
                    if (next === 'SALE' && currentCur === 'USD') {
                      form.setValue('tariffCurrency', 'LAK', { shouldDirty: true });
                    } else if (next === 'PURCHASE' && currentCur === 'LAK') {
                      form.setValue('tariffCurrency', 'USD', { shouldDirty: true });
                    }
                  }}
                  aria-labelledby={ppaFieldId('contractType-label')}
                  className="flex flex-wrap gap-x-6 gap-y-2"
                >
                  {POWER_CONTRACT_TYPES.map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <RadioGroupItem value={t} id={ppaFieldId(`contractType-${t}`)} />
                      <Label htmlFor={ppaFieldId(`contractType-${t}`)} className="text-sm font-medium">
                        {lo.ppa.typesWithCode[t]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          />
          <Field name="contractNumber" label={f.contractNumber} error={msg(errors.contractNumber)}>
            {(c) => (
              <Input
                {...c}
                placeholder={isSale ? lo.ppa.placeholders.contractNumberSale : lo.ppa.placeholders.contractNumberPurchase}
                {...register('contractNumber')}
              />
            )}
          </Field>
          <Field
            name="projectName"
            label={isSale ? lo.ppa.fields.projectNameSale : f.projectName}
            required
            error={msg(errors.projectName)}
            hint={isSale ? lo.ppa.form.projectNameSaleHint : lo.ppa.form.projectNamePurchaseHint}
          >
            {(c) => (
              <Input
                {...c}
                placeholder={isSale ? lo.ppa.placeholders.projectNameSale : lo.ppa.placeholders.projectNamePurchase}
                {...register('projectName')}
              />
            )}
          </Field>
          <ProjectTypeOrCustomerField form={form} />
          <Field name="projectLocation" label={f.projectLocation} error={msg(errors.projectLocation)}>
            {(c) => (
              <Input
                {...c}
                placeholder={isSale ? lo.ppa.placeholders.projectLocationSale : lo.ppa.placeholders.projectLocationPurchase}
                {...register('projectLocation')}
              />
            )}
          </Field>
          <Field name="status" label={f.status} error={msg(errors.status)}>
            {(c, labelId) => (
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'DRAFT'}
                    onValueChange={(val) => field.onChange(val as ContractStatus)}
                  >
                    <SelectTrigger
                      {...c}
                      id={c.id}
                      aria-labelledby={`${labelId} ${c.id}`}
                      className={cn('w-full', FOCUS)}
                    >
                      <SelectValue placeholder={lo.status.DRAFT} />
                    </SelectTrigger>
                    <SelectContent>
                      {POWER_STATUSES.map((s) => (
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
    const dateField = (name: 'signedDate' | 'effectiveDate' | 'expirationDate') => (
      <Field name={name} label={f[name]} error={msg(errors[name])}>
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
                  if (name !== 'signedDate' && form.formState.errors.expirationDate) {
                    void form.trigger('expirationDate');
                  }
                  // Auto-calculate duration if effectiveDate and expirationDate are both selected
                  const eff = name === 'effectiveDate' ? (v ?? '') : form.getValues('effectiveDate');
                  const exp = name === 'expirationDate' ? (v ?? '') : form.getValues('expirationDate');
                  if (eff && exp && exp >= eff) {
                    const diff = calculateMonthsDiff(eff, exp);
                    if (diff !== null) {
                      if (!form.getValues('durationMonths')) {
                        form.setValue('durationMonths', diff, { shouldDirty: true });
                      }
                      if (!form.getValues('durationText')) {
                        form.setValue('durationText', monthsToDurationText(diff), { shouldDirty: true });
                      }
                    }
                  }
                }}
              />
            )}
          />
        )}
      </Field>
    );
    return (
      <SectionCard icon={Calendar} title={lo.ppa.form.sectionDates}>
        <div className={GRID}>
          {dateField('signedDate')}
          {dateField('effectiveDate')}
          {dateField('expirationDate')}
          <Field name="durationText" label={f.durationText} error={msg(errors.durationText)}>
            {(c) => (
              <Input
                {...c}
                placeholder={isSale ? lo.ppa.placeholders.durationTextSale : lo.ppa.placeholders.durationTextPurchase}
                {...register('durationText', {
                  onChange: (e) => {
                    const val = (e.target as HTMLInputElement).value;
                    const parsed = durationTextToMonths(val);
                    if (parsed !== null && !form.getValues('durationMonths')) {
                      form.setValue('durationMonths', parsed, { shouldDirty: true });
                    }
                  },
                })}
              />
            )}
          </Field>
          <Field name="durationMonths" label={f.durationMonths} error={msg(errors.durationMonths)}>
            {(c) => (
              <Controller
                control={control}
                name="durationMonths"
                render={({ field }) => (
                  <NumberInput
                    control={c}
                    nullable
                    value={field.value}
                    placeholder={isSale ? lo.ppa.placeholders.durationMonthsSale : lo.ppa.placeholders.durationMonthsPurchase}
                    onChange={(m) => {
                      field.onChange(m);
                      if (m !== null && m > 0 && !form.getValues('durationText')) {
                        form.setValue('durationText', monthsToDurationText(m), { shouldDirty: true });
                      }
                    }}
                  />
                )}
              />
            )}
          </Field>
          <Field
            name="notifyDaysBefore"
            label={f.notifyDaysBefore}
            error={msg(errors.notifyDaysBefore)}
            hint={lo.ppa.form.notifyDaysHint}
          >
            {(c) => (
              <Controller
                control={control}
                name="notifyDaysBefore"
                render={({ field }) => (
                  <NumberInput
                    control={c}
                    nullable={false}
                    value={field.value}
                    placeholder={lo.ppa.placeholders.notifyDaysBefore}
                    onChange={(v) => field.onChange(v ?? Number.NaN)}
                  />
                )}
              />
            )}
          </Field>
        </div>
      </SectionCard>
    );
  }

  if (group === 'tech') {
    const capVal = watch('capacityValue');
    const capUnit = watch('capacityUnit');
    const tarVal = watch('tariffValue');
    const tarCur = watch('tariffCurrency');

    const capPreview = composeInstalledCapacity(capVal, capUnit);
    const tarPreview = composeTariff(tarVal, tarCur);

    return (
      <SectionCard icon={Zap} title={lo.ppa.form.sectionTech}>
        <div className={GRID}>
          <Field
            name="capacityValue"
            label={f.capacityValue}
            error={msg(errors.capacityValue)}
            hint={capPreview ? lo.ppa.form.capacityPreview(capPreview) : undefined}
          >
            {(c) => (
              <Controller
                control={control}
                name="capacityValue"
                render={({ field }) => (
                  <NumberInput
                    control={c}
                    nullable
                    value={field.value}
                    placeholder={isSale ? lo.ppa.placeholders.capacityValueSale : lo.ppa.placeholders.capacityValuePurchase}
                    onChange={field.onChange}
                  />
                )}
              />
            )}
          </Field>
          <Field name="capacityUnit" label={f.capacityUnit} error={msg(errors.capacityUnit)}>
            {(c) => (
              <Controller
                control={control}
                name="capacityUnit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger {...c} ref={field.ref} onBlur={field.onBlur} className={cn('w-full', FOCUS)}>
                      <SelectValue />
                    </SelectTrigger>
                    <EnumOptions options={POWER_CAPACITY_UNITS} />
                  </Select>
                )}
              />
            )}
          </Field>
          <Field
            name="tariffValue"
            label={f.tariffValue}
            error={msg(errors.tariffValue)}
            hint={tarPreview ? lo.ppa.form.tariffPreview(tarPreview) : undefined}
          >
            {(c) => (
              <Controller
                control={control}
                name="tariffValue"
                render={({ field }) => (
                  <NumberInput
                    control={c}
                    nullable
                    value={field.value}
                    placeholder={isSale ? lo.ppa.placeholders.tariffValueSale : lo.ppa.placeholders.tariffValuePurchase}
                    onChange={field.onChange}
                  />
                )}
              />
            )}
          </Field>
          <Field name="tariffCurrency" label={f.tariffCurrency} error={msg(errors.tariffCurrency)}>
            {(c) => (
              <Controller
                control={control}
                name="tariffCurrency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger {...c} ref={field.ref} onBlur={field.onBlur} className={cn('w-full', FOCUS)}>
                      <SelectValue />
                    </SelectTrigger>
                    <EnumOptions options={POWER_CURRENCIES} />
                  </Select>
                )}
              />
            )}
          </Field>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard icon={AlignLeft} title={lo.ppa.form.sectionNotes}>
      <div className={GRID}>
        <Field name="additionalDetails" label={f.additionalDetails} wide error={msg(errors.additionalDetails)}>
          {(c) => (
            <Textarea
              {...c}
              rows={3}
              placeholder={isSale ? lo.ppa.placeholders.additionalDetailsSale : lo.ppa.placeholders.additionalDetailsPurchase}
              {...register('additionalDetails')}
            />
          )}
        </Field>
      </div>
    </SectionCard>
  );
}
