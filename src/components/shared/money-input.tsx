import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Money } from '@/types/domain';
import { lo } from '@/lib/i18n/lo';
import { formatNumber } from '@/lib/utils/number';

type Currency = Money['currency'];

interface MoneyInputProps {
  id: string;
  value: Money | null;
  onChange: (v: Money | null) => void;
  currencies: Currency[];
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '.' || !/^\d*\.?\d*$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function display(value: Money | null): string {
  return value ? formatNumber(value.amount, 6) : '';
}

export function MoneyInput({
  id,
  value,
  onChange,
  currencies,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
}: MoneyInputProps) {
  const [raw, setRaw] = useState(() => display(value));
  const [prevValue, setPrevValue] = useState(value);
  const [fallbackCurrency, setFallbackCurrency] = useState<Currency>(value?.currency ?? currencies[0]);

  // Resync the text only when an external value differs from what the text already means.
  if (value !== prevValue) {
    setPrevValue(value);
    setFallbackCurrency(value ? value.currency : currencies[0]);
    if ((value?.amount ?? null) !== parseAmount(raw)) setRaw(display(value));
  }

  const currency = value?.currency ?? fallbackCurrency;

  const emit = (text: string, cur: Currency) => {
    const amount = parseAmount(text);
    onChange(amount === null ? null : { amount, currency: cur });
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          emit(e.target.value, currency);
        }}
        onBlur={() => {
          const amount = parseAmount(raw);
          if (amount !== null) setRaw(formatNumber(amount, 6));
        }}
      />
      <Select
        value={currency}
        onValueChange={(c) => {
          setFallbackCurrency(c as Currency);
          emit(raw, c as Currency);
        }}
      >
        <SelectTrigger aria-label={lo.money.currency} aria-invalid={ariaInvalid} className="w-28 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((c) => (
            <SelectItem key={c} value={c}>
              {lo.currency[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
