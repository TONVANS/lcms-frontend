import { differenceInCalendarDays, intervalToDuration, isValid, parseISO } from 'date-fns';
import { lo } from '@/lib/i18n/lo';

export function suggestTermText(effective: string, end: string): string {
  const start = parseISO(effective);
  const finish = parseISO(end);
  if (!isValid(start) || !isValid(finish) || finish <= start) return '';
  const d = intervalToDuration({ start, end: finish });
  let years = d.years ?? 0;
  let months = d.months ?? 0;
  years += Math.floor(months / 12);
  months %= 12;
  if (years === 0 && months === 0) {
    return lo.gc.term.days(differenceInCalendarDays(finish, start));
  }
  const parts: string[] = [];
  if (years > 0) parts.push(lo.gc.term.years(years));
  if (months > 0) parts.push(lo.gc.term.months(months));
  return parts.join(' ');
}
