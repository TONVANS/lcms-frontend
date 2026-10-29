'use client';

import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
  'aria-required': boolean | undefined;
}

export interface FieldProps {
  idPrefix: string;
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  wide?: boolean;
  children: (control: FieldControlProps, labelId: string) => ReactNode;
}

export const TOKEN_FIELD =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

export const fieldDomId = (idPrefix: string, name: string): string => `${idPrefix}-field-${name}`;

/** One labelled field: visible <label>, gold aria-hidden marker, error linked by aria-describedby. */
export function Field({ idPrefix, name, label, required, error, wide, children }: FieldProps) {
  const id = fieldDomId(idPrefix, name);
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

export const FIELD_GRID = 'grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4';
