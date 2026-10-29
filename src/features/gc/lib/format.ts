import { formatDate } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/number';
import type { Currency } from '@/types/domain';

/** Placeholder for an empty value; shared by the detail page and the wizard review. */
export const EMPTY = '—';

export function displayText(s: string | null | undefined): string {
  return s && s.trim() !== '' ? s.trim() : EMPTY;
}

export function displayDate(s: string | null | undefined): string {
  return s ? formatDate(s) : EMPTY;
}

/** "1,500,000 USD"; a value without a currency shows the bare number. */
export function formatValue(amount: number | null | undefined, currency: Currency | string | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return EMPTY;
  return currency ? `${formatNumber(amount)} ${currency}` : formatNumber(amount);
}
