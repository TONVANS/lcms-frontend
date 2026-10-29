import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { toCsv } from '@/lib/utils/export-csv';
import type { LegalCase } from '../types';
import { caseTotalDue } from './legal-case-mapper';

/** One row per case; amounts are plain numbers (null becomes empty), dates dd/mm/yyyy. */
export function buildLegalCasesCsv(items: readonly LegalCase[]): string {
  const rows = items.map((c) => [
    c.caseCode,
    c.defendant,
    c.allegation,
    c.department?.name ?? null,
    lo.legal.caseTypes[c.caseType],
    lo.legal.disputeStatus[c.disputeStatus],
    c.damageLak,
    c.damageUsd,
    c.fineLak,
    c.fineUsd,
    caseTotalDue(c, 'lak'),
    caseTotalDue(c, 'usd'),
    c.recoveredLak,
    c.recoveredUsd,
    c.date ? formatDate(c.date) : null,
    c.disputeProgress,
  ]);
  return toCsv(lo.legal.cases.csv.headers, rows);
}
