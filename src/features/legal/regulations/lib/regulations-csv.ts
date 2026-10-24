import { lo } from '@/lib/i18n/lo';
import { toCsv } from '@/lib/utils/export-csv';
import { formatDate } from '@/lib/utils/date';
import type { Regulation } from '../types';

/** Spec §6.6 columns, in order. Dates are dd/mm/yyyy; the year stays a plain number. */
export function buildRegulationsCsv(items: readonly Regulation[]): string {
  const headers = lo.legal.regulations.csv.headers;
  const rows = items.map((r) => [
    r.number,
    formatDate(r.issuedDate),
    r.title,
    r.type === 'other' && r.typeOther ? r.typeOther : lo.legal.regulationTypes[r.type],
    r.year,
    r.purpose,
    r.responsible,
    lo.legal.units[r.unit],
    lo.legal.regulationStatus[r.status],
    r.externalLinks.join(lo.legal.regulations.csv.linkSeparator),
  ]);
  return toCsv(headers, rows);
}
