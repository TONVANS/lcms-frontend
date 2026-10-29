import { lo } from '@/lib/i18n/lo';
import { toCsv } from '@/lib/utils/export-csv';
import type { LegalDocument } from '../types';

/** One row per document; labels are Lao, never enum keys. */
export function buildLegalDocumentsCsv(items: readonly LegalDocument[]): string {
  const rows = items.map((d) => [
    d.docTitle,
    d.docNumberDate,
    lo.legal.docTypes[d.docType],
    d.issueYear,
    d.department?.name ?? null,
    d.responsiblePerson,
    lo.legal.docStatus[d.status],
    d.purpose,
    d.externalUrl,
  ]);
  return toCsv(lo.legal.regulations.csv.headers, rows);
}
