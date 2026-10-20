import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { lo } from '@/lib/i18n/lo';

export const LAO_MONTHS_SHORT: readonly string[] = lo.date.monthsShort;
export const LAO_WEEKDAYS: readonly string[] = lo.date.weekdays;

const EMPTY = '—';

export function formatDate(iso?: string | null): string {
  if (!iso) return EMPTY;
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'dd/MM/yyyy') : EMPTY;
}

export function formatMonthYear(iso?: string | null): string {
  if (!iso) return EMPTY;
  const d = parseISO(iso);
  return isValid(d) ? format(d, 'MM/yyyy') : EMPTY;
}

export function daysLeft(iso?: string | null, today: Date = new Date()): number | null {
  if (!iso) return null;
  const d = parseISO(iso);
  if (!isValid(d) || !isValid(today)) return null;
  return differenceInCalendarDays(d, today);
}
