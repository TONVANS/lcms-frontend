import { formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/money';
import type { GcEquity } from '../types';

/** Placeholder for an empty value; shared by the detail page and the wizard review. */
export const EMPTY = '—';

export function formatEquity(e: GcEquity | null | undefined): string {
  if (!e) return EMPTY;
  return e.kind === 'percent' ? `${e.percent}%` : formatMoney(e.money);
}

export function displayText(s: string | null | undefined): string {
  return s && s.trim() !== '' ? s.trim() : EMPTY;
}

export function displayDate(s: string | null | undefined): string {
  return s ? formatDate(s) : EMPTY;
}
