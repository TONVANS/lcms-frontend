'use client';

import { Plus, X } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { Controller, useWatch, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { DatePicker } from '@/components/shared/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { LEGAL_UNITS } from '../../constants';
import { yearOf, type RegulationFormValues } from '../schemas/regulation.schema';
import { REGULATION_STATUSES, REGULATION_TYPES } from '../types';

export type RegulationFormFieldName = keyof RegulationFormValues;

/** Visual order of the fields; the first invalid one receives focus. */
export const REGULATION_FIELD_ORDER: readonly RegulationFormFieldName[] = [
  'title',
  'type',
  'typeOther',
  'number',
  'issuedDate',
  'year',
  'purpose',
  'responsible',
  'unit',
  'status',
  'externalLinks',
];

export const regulationFieldId = (name: string): string => `reg-field-${name}`;

interface LinkErrors {
  message?: string;
  [index: number]: { message?: string } | undefined;
}

/** DOM id of the control that should be focused for the first error in `errors`. */
export function firstInvalidRegulationFieldId(
  errors: FieldErrors<RegulationFormValues>,
): string | null {
  for (const name of REGULATION_FIELD_ORDER) {
    const err = errors[name];
    if (!err) continue;
    if (name === 'externalLinks') {
      const rows = err as unknown as Record<string, unknown>;
      const first = Object.keys(rows)
        .filter((k) => /^\d+$/.test(k) && rows[k])
        .map(Number)
        .sort((x, y) => x - y)[0];
      if (first !== undefined) return regulationFieldId(`externalLinks-${first}`);
      return regulationFieldId('externalLinks-add');
    }
    return regulationFieldId(name);
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
  const id = regulationFieldId(name);
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

function msg(err: { message?: string } | undefined): string | undefined {
  return err?.message;
}

function LinksField({ form }: { form: UseFormReturn<RegulationFormValues> }) {
  const errors = form.formState.errors.externalLinks as unknown as LinkErrors | undefined;
  const base = regulationFieldId('externalLinks');
  const groupError = errors?.message;
  return (
    <Controller
      control={form.control}
      name="externalLinks"
      render={({ field }) => {
        const links = field.value;
        const set = (next: string[]) => field.onChange(next);
        return (
          <div className="col-span-full flex flex-col gap-2.5">
            <span id={`${base}-label`} className="text-xs font-medium text-(--text-secondary)">
              {lo.legal.fields.externalLinks}
            </span>
            {links.map((link, i) => {
              const rowError = errors?.[i]?.message;
              const id = regulationFieldId(`externalLinks-${i}`);
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Input
                      id={id}
                      type="url"
                      inputMode="url"
                      value={link}
                      placeholder={lo.legal.regulations.form.linkPlaceholder}
                      aria-label={lo.legal.regulations.form.linkItem(i + 1)}
                      aria-invalid={Boolean(rowError)}
                      aria-describedby={rowError ? `${id}-error` : undefined}
                      onChange={(e) => set(links.map((l, j) => (j === i ? e.target.value : l)))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={lo.legal.regulations.form.removeLink(i + 1)}
                      onClick={() => {
                        form.clearErrors('externalLinks');
                        set(links.filter((_, j) => j !== i));
                      }}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                  {rowError ? (
                    <p id={`${id}-error`} className="text-xs text-(--text-error)">
                      {rowError}
                    </p>
                  ) : null}
                </div>
              );
            })}
            {groupError ? (
              <p id={`${base}-error`} className="text-xs text-(--text-error)">
                {groupError}
              </p>
            ) : null}
            <div>
              <Button
                type="button"
                id={regulationFieldId('externalLinks-add')}
                variant="secondary"
                size="sm"
                onClick={() => set([...links, ''])}
                className="gap-1.5"
              >
                <Plus aria-hidden="true" />
                {lo.legal.regulations.form.addLink}
              </Button>
            </div>
          </div>
        );
      }}
    />
  );
}

/**
 * All regulation fields in spec order. Shared by the dialog and the wizard. `year` follows
 * `issuedDate` until the user edits it (or when the stored year already differs from the date).
 */
export function RegulationFormFields({ form }: { form: UseFormReturn<RegulationFormValues> }) {
  const { register, control } = form;
  const errors = form.formState.errors;
  const f = lo.legal.fields;
  const type = useWatch({ control, name: 'type' });
  const yearTouched = useRef<boolean | null>(null);
  if (yearTouched.current === null) {
    const v = form.getValues();
    yearTouched.current = v.year !== '' && v.year !== yearOf(v.issuedDate);
  }

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
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  if (v !== 'other') {
                    // A hidden over-long value must never block submit.
                    form.setValue('typeOther', '', { shouldDirty: true });
                    form.clearErrors('typeOther');
                  }
                }}
              >
                <SelectTrigger {...c} ref={field.ref} onBlur={field.onBlur} className={cn('w-full', TOKEN_FIELD)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGULATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {lo.legal.regulationTypes[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>

      {type === 'other' ? (
        <Field name="typeOther" label={f.typeOther} required error={msg(errors.typeOther)}>
          {(c) => <Input {...c} {...register('typeOther')} />}
        </Field>
      ) : null}

      <Field name="number" label={f.number} required error={msg(errors.number)}>
        {(c) => <Input {...c} {...register('number')} />}
      </Field>

      <Field name="issuedDate" label={f.issuedDate} required error={msg(errors.issuedDate)}>
        {(c, labelId) => (
          <Controller
            control={control}
            name="issuedDate"
            render={({ field }) => (
              <DatePicker
                id={c.id}
                labelId={labelId}
                aria-invalid={c['aria-invalid']}
                aria-describedby={c['aria-describedby']}
                required
                value={field.value || null}
                onChange={(v) => {
                  field.onChange(v ?? '');
                  if (!yearTouched.current) {
                    form.setValue('year', yearOf(v ?? ''), { shouldDirty: true });
                    form.clearErrors('year');
                  }
                }}
              />
            )}
          />
        )}
      </Field>

      <Field name="year" label={f.year} error={msg(errors.year)}>
        {(c) => (
          <Input
            {...c}
            inputMode="numeric"
            {...register('year', {
              onChange: () => {
                yearTouched.current = true;
              },
            })}
          />
        )}
      </Field>

      <Field name="purpose" label={f.purpose} wide error={msg(errors.purpose)}>
        {(c) => <Textarea {...c} rows={3} {...register('purpose')} />}
      </Field>

      <Field name="responsible" label={f.responsible} error={msg(errors.responsible)}>
        {(c) => <Input {...c} {...register('responsible')} />}
      </Field>

      <Field name="unit" label={f.unit} required error={msg(errors.unit)}>
        {(c) => (
          <Controller
            control={control}
            name="unit"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger {...c} ref={field.ref} onBlur={field.onBlur} className={cn('w-full', TOKEN_FIELD)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {lo.legal.units[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>

      <Field name="status" label={f.status} required error={msg(errors.status)}>
        {(c) => (
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger {...c} ref={field.ref} onBlur={field.onBlur} className={cn('w-full', TOKEN_FIELD)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGULATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {lo.legal.regulationStatus[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>

      <LinksField form={form} />
    </div>
  );
}
