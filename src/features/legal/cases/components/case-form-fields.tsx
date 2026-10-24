'use client';

import { Controller, useWatch, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { DatePicker } from '@/components/shared/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/number';
import { caseTotal } from '../lib/case-money';
import type { CaseFormValues } from '../schemas/case.schema';
import { CASE_STAGES, CASE_TYPES, type LegalCase } from '../types';
import { DualAmountField } from './dual-amount-field';

export type CaseFormFieldName = keyof CaseFormValues;

export const CASE_FIELD_ORDER: readonly CaseFormFieldName[] = [
  'defendant',
  'allegation',
  'handlingUnit',
  'caseType',
  'stage',
  'damage',
  'fine',
  'recovered',
  'disputeDate',
  'progress',
];

export const caseFieldId = (name: string): string => `case-field-${name}`;

export function firstInvalidCaseFieldId(
  errors: FieldErrors<CaseFormValues>,
): string | null {
  for (const name of CASE_FIELD_ORDER) {
    const err = errors[name];
    if (!err) continue;
    if (name === 'damage' || name === 'fine' || name === 'recovered') {
      return `${caseFieldId(name)}-lak`;
    }
    return caseFieldId(name);
  }
  return null;
}

const TOKEN_FIELD =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

interface FieldProps {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  wide?: boolean;
  children: (control: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined; 'aria-required': boolean | undefined }, labelId: string) => React.ReactNode;
}

function Field({ name, label, required, error, wide, children }: FieldProps) {
  const id = caseFieldId(name);
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
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface CaseFormFieldsProps {
  form: UseFormReturn<CaseFormValues>;
  legalCase?: LegalCase;
  fields?: readonly CaseFormFieldName[];
}

export function CaseFormFields({ form, legalCase, fields }: CaseFormFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const damage = useWatch({ control, name: 'damage' });
  const fine = useWatch({ control, name: 'fine' });

  const total = caseTotal({
    damage: damage ?? { lak: null, usd: null },
    fine: fine ?? { lak: null, usd: null },
  });

  const lakDisplay = total.lak === null ? '—' : formatNumber(total.lak);
  const usdDisplay = total.usd === null ? '—' : formatNumber(total.usd);

  const F = lo.legal.fields;
  const L = lo.legal.cases.form;

  const isShown = (name: CaseFormFieldName) => !fields || fields.includes(name);
  const showAmounts = !fields || fields.includes('damage') || fields.includes('fine') || fields.includes('recovered');
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {legalCase && isShown('defendant') ? (
        <div className="col-span-full flex flex-col gap-1.5">
          <Label className="text-xs text-(--text-secondary)">{F.caseNo}</Label>
          <div className="flex h-11 items-center rounded-lg border border-[rgba(11,27,58,0.14)] bg-(--surface-input)/50 px-3 py-2 text-sm font-semibold tracking-wide text-(--text) dark:border-white/14">
            {legalCase.caseNo}
          </div>
        </div>
      ) : null}

      {isShown('defendant') ? (
      <Field name="defendant" label={F.defendant} required error={errors.defendant?.message} wide>
        {(c) => (
          <Input
            {...register('defendant')}
            {...c}
            className={cn(
              'h-11 rounded-lg border-[rgba(11,27,58,0.14)] bg-(--surface-input) text-sm dark:border-white/14',
              TOKEN_FIELD,
            )}
          />
        )}
      </Field>
      ) : null}

      {isShown('allegation') ? (
      <Field name="allegation" label={F.allegation} required error={errors.allegation?.message} wide>
        {(c) => (
          <Textarea
            {...register('allegation')}
            {...c}
            rows={3}
            className={cn(
              'rounded-lg border-[rgba(11,27,58,0.14)] bg-(--surface-input) text-sm dark:border-white/14',
              TOKEN_FIELD,
            )}
          />
        )}
      </Field>
      ) : null}

      {isShown('handlingUnit') ? (
      <Field name="handlingUnit" label={F.handlingUnit} required error={errors.handlingUnit?.message} wide>
        {(c) => (
          <Input
            {...register('handlingUnit')}
            {...c}
            className={cn(
              'h-11 rounded-lg border-[rgba(11,27,58,0.14)] bg-(--surface-input) text-sm dark:border-white/14',
              TOKEN_FIELD,
            )}
          />
        )}
      </Field>
      ) : null}

      {isShown('caseType') ? (
      <Field name="caseType" label={F.caseType} required error={errors.caseType?.message}>
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
                  className={cn(
                    'h-11 w-full rounded-lg border-[rgba(11,27,58,0.14)] bg-(--surface-input) text-sm dark:border-white/14',
                    TOKEN_FIELD,
                  )}
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

      {isShown('stage') ? (
      <Field name="stage" label={F.stage} required error={errors.stage?.message}>
        {(c, labelId) => (
          <Controller
            control={control}
            name="stage"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={c.id}
                  aria-labelledby={`${labelId} ${c.id}`}
                  aria-invalid={c['aria-invalid']}
                  aria-describedby={c['aria-describedby']}
                  className={cn(
                    'h-11 w-full rounded-lg border-[rgba(11,27,58,0.14)] bg-(--surface-input) text-sm dark:border-white/14',
                    TOKEN_FIELD,
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CASE_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {lo.legal.caseStages[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>
      ) : null}

      {showAmounts ? (
      <div className="col-span-full flex flex-col gap-3 rounded-xl border border-[rgba(11,27,58,0.12)] bg-(--surface-card)/40 p-4 dark:border-white/12">
        <span className="text-xs font-semibold tracking-wide text-(--text-strong)">
          {L.amountsSection}
        </span>

        <Controller
          control={control}
          name="damage"
          render={({ field }) => (
            <DualAmountField
              id={caseFieldId('damage')}
              label={F.damage}
              value={field.value}
              onChange={field.onChange}
              error={errors.damage?.lak?.message || errors.damage?.usd?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="fine"
          render={({ field }) => (
            <DualAmountField
              id={caseFieldId('fine')}
              label={F.fine}
              value={field.value}
              onChange={field.onChange}
              error={errors.fine?.lak?.message || errors.fine?.usd?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="recovered"
          render={({ field }) => (
            <DualAmountField
              id={caseFieldId('recovered')}
              label={F.recovered}
              value={field.value}
              onChange={field.onChange}
              error={errors.recovered?.lak?.message || errors.recovered?.usd?.message}
            />
          )}
        />

        <div
          role="region"
          aria-label={F.total}
          className="flex flex-col gap-2 rounded-lg border border-[rgba(11,27,58,0.1)] bg-(--surface-input)/50 p-3 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-(--text)">{F.total}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border border-[rgba(11,27,58,0.08)] bg-background/60 px-3 py-2 text-sm dark:border-white/8">
              <span className="text-xs text-(--text-muted)">{F.lak}</span>
              <span className="font-semibold tabular-nums text-(--text)">{lakDisplay}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-[rgba(11,27,58,0.08)] bg-background/60 px-3 py-2 text-sm dark:border-white/8">
              <span className="text-xs text-(--text-muted)">{F.usd}</span>
              <span className="font-semibold tabular-nums text-(--text)">{usdDisplay}</span>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      {isShown('disputeDate') ? (
      <Field name="disputeDate" label={F.disputeDate} error={errors.disputeDate?.message} wide>
        {(c, labelId) => (
          <Controller
            control={control}
            name="disputeDate"
            render={({ field }) => (
              <DatePicker
                id={c.id}
                labelId={labelId}
                value={field.value ?? null}
                onChange={(d) => field.onChange(d ?? null)}
                aria-invalid={c['aria-invalid']}
                aria-describedby={c['aria-describedby']}
              />
            )}
          />
        )}
      </Field>
      ) : null}

      {isShown('progress') ? (
      <Field name="progress" label={F.progress} error={errors.progress?.message} wide>
        {(c) => (
          <Textarea
            {...register('progress')}
            {...c}
            rows={3}
            className={cn(
              'rounded-lg border-[rgba(11,27,58,0.14)] bg-(--surface-input) text-sm dark:border-white/14',
              TOKEN_FIELD,
            )}
          />
        )}
      </Field>
      ) : null}
    </div>
  );
}
