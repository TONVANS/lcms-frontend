import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { toCsv } from '@/lib/utils/export-csv';
import { caseTotal } from './case-money';
import type { LegalCase } from '../types';

/** Spec §6.6 columns, in order. Amounts are plain numbers (null becomes empty). */
export function buildCasesCsv(items: readonly LegalCase[]): string {
  const headers = lo.legal.cases.csv.headers;
  const rows = items.map((c) => {
    const totals = caseTotal(c);
    return [
      c.caseNo,
      c.defendant,
      c.allegation,
      c.handlingUnit,
      lo.legal.caseTypes[c.caseType],
      lo.legal.caseStages[c.stage],
      c.damage.lak,
      c.damage.usd,
      c.fine.lak,
      c.fine.usd,
      totals.lak,
      totals.usd,
      c.recovered.lak,
      c.recovered.usd,
      c.disputeDate ? formatDate(c.disputeDate) : null,
      c.progress ?? null,
    ];
  });
  return toCsv(headers, rows);
}
