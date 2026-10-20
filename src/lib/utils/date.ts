import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { lo } from '@/lib/i18n/lo';

export const LAO_MONTHS_SHORT: readonly string[] = lo.date.monthsShort;
export const LAO_WEEKDAYS: readonly string[] = lo.date.weekdays;

const EMPTY = '—';

export function formatDate(iso?: string | null): string {
  return iso ? format(parseISO(iso), 'dd/MM/yyyy') : EMPTY;
}

export function formatMonthYear(iso?: string | null): string {
  return iso ? format(parseISO(iso), 'MM/yyyy') : EMPTY;
}

export function daysLeft(iso: string, today: Date = new Date()): number {
  return differenceInCalendarDays(parseISO(iso), today);
}
