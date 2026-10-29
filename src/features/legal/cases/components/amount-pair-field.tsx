'use client';

import { MoneyInput } from '@/components/shared/money-input';
import { Label } from '@/components/ui/label';
import { lo } from '@/lib/i18n/lo';

export interface AmountPairFieldProps {
  id: string;
  label: string;
  lak: number | null;
  usd: number | null;
  onChangeLak: (v: number | null) => void;
  onChangeUsd: (v: number | null) => void;
  error?: string;
}

/** A LAK input and a USD input side by side, bound to two flat numeric fields. */
export function AmountPairField({ id, label, lak, usd, onChangeLak, onChangeUsd, error }: AmountPairFieldProps) {
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex min-w-0 flex-col gap-2 rounded-lg border border-[rgba(11,27,58,0.08)] bg-(--surface-input)/30 p-3 dark:border-white/8"
    >
      <div className="flex items-center justify-between">
        <span id={labelId} className="text-xs font-medium text-(--text-secondary)">
          {label}
        </span>
        {error ? (
          <span id={errorId} role="alert" className="text-xs text-(--text-error)">
            {error}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1">
          <Label htmlFor={`${id}-lak`} className="text-[11px] font-medium text-(--text-muted)">
            <span className="sr-only">{label} </span>
            {lo.legal.fields.lak}
          </Label>
          <MoneyInput
            id={`${id}-lak`}
            value={lak !== null ? { amount: lak, currency: 'LAK' } : null}
            currencies={['LAK']}
            onChange={(m) => onChangeLak(m ? m.amount : null)}
            aria-label={`${label} ${lo.legal.fields.lak}`}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <Label htmlFor={`${id}-usd`} className="text-[11px] font-medium text-(--text-muted)">
            <span className="sr-only">{label} </span>
            {lo.legal.fields.usd}
          </Label>
          <MoneyInput
            id={`${id}-usd`}
            value={usd !== null ? { amount: usd, currency: 'USD' } : null}
            currencies={['USD']}
            onChange={(m) => onChangeUsd(m ? m.amount : null)}
            aria-label={`${label} ${lo.legal.fields.usd}`}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
      </div>
    </div>
  );
}
