'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDepartments } from '@/features/lookups';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { ALL_FILTER } from '../constants';
import { TOKEN_FIELD, type FieldControlProps } from './form-field';

const NONE = '__none__';

/** Department dropdown for forms. `optional` adds a "not specified" entry that maps to ''. */
export function DepartmentField({
  control,
  value,
  onChange,
  onBlur,
  optional,
  labelId,
}: {
  control: FieldControlProps;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  optional?: boolean;
  labelId?: string;
}) {
  const { items, status, error } = useDepartments();
  const known = items.some((d) => d.id === value);
  return (
    <>
      <Select
        value={value === '' ? (optional ? NONE : '') : value}
        onValueChange={(v) => onChange(v === NONE ? '' : v)}
      >
        <SelectTrigger
          id={control.id}
          aria-labelledby={labelId ? `${labelId} ${control.id}` : undefined}
          aria-invalid={control['aria-invalid']}
          aria-describedby={control['aria-describedby']}
          aria-required={control['aria-required']}
          onBlur={onBlur}
          className={cn('w-full', TOKEN_FIELD)}
        >
          <SelectValue placeholder={lo.legal.fields.department} />
        </SelectTrigger>
        <SelectContent>
          {optional ? <SelectItem value={NONE}>{lo.legal.fields.noDepartment}</SelectItem> : null}
          {value !== '' && !known ? <SelectItem value={value}>{value}</SelectItem> : null}
          {items.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {status === 'error' && error ? (
        <p role="status" className="text-xs text-(--text-error)">
          {lo.legal.fields.departmentsFailed}
        </p>
      ) : null}
    </>
  );
}

/** Compact department filter for list toolbars. */
export function DepartmentFilter({
  id,
  value,
  onChange,
  label,
  allLabel,
}: {
  id: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  label: string;
  allLabel: string;
}) {
  const { items } = useDepartments();
  return (
    <Select value={value ?? ALL_FILTER} onValueChange={(v) => onChange(v === ALL_FILTER ? undefined : v)}>
      <SelectTrigger id={id} aria-label={label} className="h-10 w-full">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_FILTER}>{allLabel}</SelectItem>
        {items.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {d.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
