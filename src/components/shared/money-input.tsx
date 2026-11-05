import { useRef, useState } from 'react';
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
  'aria-required'?: boolean;
  placeholder?: string;
  showGuide?: boolean;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '.' || cleaned === '-' || !/^-?\d*\.?\d*$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatWithCommas(raw: string): string {
  const cleaned = raw.replace(/,/g, '').trim();
  if (!cleaned) return '';
  if (cleaned === '.' || cleaned === '-') return cleaned;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return raw;

  const parts = cleaned.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (parts.length > 1) {
    return `${formattedInteger}.${decimalPart}`;
  }
  return formattedInteger;
}

function calculateNewCursor(oldValue: string, newValue: string, oldCursor: number): number {
  let nonCommasBefore = 0;
  for (let i = 0; i < oldCursor && i < oldValue.length; i++) {
    if (oldValue[i] !== ',') nonCommasBefore++;
  }
  let newCursor = 0;
  let count = 0;
  while (newCursor < newValue.length && count < nonCommasBefore) {
    if (newValue[newCursor] !== ',') count++;
    newCursor++;
  }
  return newCursor;
}

export function formatLaoScale(n: number): string | null {
  if (!Number.isFinite(n) || n < 10000) return null;
  if (n >= 1_000_000_000) {
    const val = n / 1_000_000_000;
    const formatted = Number.isInteger(val) ? String(val) : val.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted} ຕື້`;
  }
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    const formatted = Number.isInteger(val) ? String(val) : val.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted} ລ້ານ`;
  }
  if (n >= 100_000) {
    const val = n / 100_000;
    const formatted = Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.?0+$/, '');
    return `${formatted} ແສນ`;
  }
  if (n >= 10_000) {
    const val = n / 10_000;
    const formatted = Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.?0+$/, '');
    return `${formatted} ໝື່ນ`;
  }
  return null;
}

function display(value: Money | null): string {
  return value ? formatWithCommas(String(value.amount)) : '';
}

export function MoneyInput({
  id,
  value,
  onChange,
  currencies,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  'aria-required': ariaRequired,
  placeholder,
  showGuide = true,
}: MoneyInputProps) {
  const [raw, setRaw] = useState(() => display(value));
  const [prevValue, setPrevValue] = useState(value);
  const [fallbackCurrency, setFallbackCurrency] = useState<Currency>(value?.currency ?? currencies[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resync the text only when an external value differs from what the text already means.
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) setFallbackCurrency(value.currency);
    if ((value?.amount ?? null) !== parseAmount(raw)) {
      setRaw(display(value));
    }
  }

  const currency = value?.currency ?? fallbackCurrency;

  const emit = (text: string, cur: Currency) => {
    const amount = parseAmount(text);
    onChange(amount === null ? null : { amount, currency: cur });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawText = input.value;
    const oldCursor = input.selectionStart ?? rawText.length;

    const cleaned = rawText.replace(/,/g, '').trim();
    if (cleaned !== '' && cleaned !== '.' && cleaned !== '-' && !/^-?\d*\.?\d*$/.test(cleaned)) {
      return;
    }

    const formatted = formatWithCommas(rawText);
    const newCursor = calculateNewCursor(rawText, formatted, oldCursor);

    setRaw(formatted);
    emit(formatted, currency);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      // If cursor is right after a comma and no text range is selected, delete the digit before the comma
      if (start === end && start > 1 && raw[start - 1] === ',') {
        e.preventDefault();
        const before = raw.slice(0, start - 2);
        const after = raw.slice(start);
        const nextRaw = before + after;
        const formatted = formatWithCommas(nextRaw);
        const newCursor = calculateNewCursor(nextRaw, formatted, start - 2);
        setRaw(formatted);
        emit(formatted, currency);
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(newCursor, newCursor);
          }
        });
      }
    }
  };

  const handleBlur = () => {
    const amount = parseAmount(raw);
    if (amount !== null) {
      setRaw(formatWithCommas(formatNumber(amount, 6)));
    }
  };

  const parsedAmount = parseAmount(raw);
  const scale = parsedAmount !== null ? formatLaoScale(parsedAmount) : null;
  const currencyLabel = lo.currency[currency] ?? currency;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-required={ariaRequired}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          value={raw}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
        {currencies.length === 1 ? (
          <span className="w-28 shrink-0 text-sm font-medium text-(--text-secondary)">
            {lo.currency[currency]}
          </span>
        ) : (
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
        )}
      </div>

      {showGuide && parsedAmount !== null && parsedAmount > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 px-0.5 text-xs text-(--text-muted) animate-in fade-in duration-150">
          <span className="text-[11px] font-medium text-(--text-secondary)">
            {lo.money.amount}:
          </span>
          <span className="font-mono font-medium text-(--gold)">
            {formatNumber(parsedAmount, 6)} {currencyLabel}
          </span>
          {scale ? (
            <span className="rounded border border-(--border-subtle) bg-white/5 px-1.5 py-0.5 text-[11px] font-medium text-(--text-secondary) dark:bg-white/10">
              ~{scale}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
