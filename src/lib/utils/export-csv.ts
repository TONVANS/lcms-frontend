import { format } from 'date-fns';

const BOM = '﻿';
const FORMULA_TRIGGER = /^[=+\-@]/;

type CsvCell = string | number | null;

function cell(value: CsvCell): string {
  if (value === null) return '""';
  // Formula guard applies to string cells only; numbers are written as-is.
  const text =
    typeof value === 'string' && FORMULA_TRIGGER.test(value) ? `'${value}` : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/** Builds a UTF-8 BOM-prefixed, CRLF-separated CSV with every cell quoted. */
export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): string {
  const lines = [headers, ...rows].map((r) => r.map(cell).join(','));
  return `${BOM}${lines.join('\r\n')}\r\n`;
}

/** Triggers a browser download of the CSV text. Browser-only. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Local date as yyyy-MM-dd, for filenames. */
export function csvStamp(today: Date = new Date()): string {
  return format(today, 'yyyy-MM-dd');
}
