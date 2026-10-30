import { toNum, toStr, unwrap } from '@/lib/api/envelope';
import { isRecord, pickEnum, toCountEntries } from '@/lib/api/mapper-utils';
import type { Department } from '@/types/domain';
import type { LegalDocumentFormValues } from '../schemas/legal-document.schema';
import {
  DOC_STATUSES,
  DOC_TYPES,
  type DocType,
  type LegalDocument,
  type LegalDocumentPatch,
  type LegalDocumentPayload,
  type LegalDocumentsDashboard,
} from '../types';

export function toDepartment(raw: unknown): Department | null {
  if (!isRecord(raw)) return null;
  const id = toStr(raw.id);
  if (id === null) return null;
  return { id, name: toStr(raw.name) ?? toStr(raw.nameLo) ?? id, code: toStr(raw.code) };
}

/** Tolerant: a backend row (numbers as strings, ISO datetimes, nested department) -> model. */
export function toLegalDocument(raw: unknown): LegalDocument {
  const r = isRecord(raw) ? raw : {};
  const department = toDepartment(r.department);
  return {
    id: toStr(r.id) ?? '',
    docTitle: toStr(r.docTitle) ?? '',
    docType: pickEnum(r.docType, DOC_TYPES, 'OTHER'),
    issueYear: toNum(r.issueYear),
    docNumberDate: toStr(r.docNumberDate) ?? '',
    status: pickEnum(r.status, DOC_STATUSES, 'ACTIVE'),
    responsiblePerson: toStr(r.responsiblePerson),
    departmentId: toStr(r.departmentId) ?? department?.id ?? null,
    department,
    purpose: toStr(r.purpose),
    externalUrl: toStr(r.externalUrl),
    createdAt: toStr(r.createdAt) ?? '',
    updatedAt: toStr(r.updatedAt) ?? '',
  };
}

const opt = (s: string): string | undefined => {
  const t = s.trim();
  return t === '' ? undefined : t;
};

export function toLegalDocumentPayload(f: LegalDocumentFormValues): LegalDocumentPayload {
  const payload: LegalDocumentPayload = {
    docTitle: f.docTitle.trim(),
    docType: f.docType,
    issueYear: Number(f.issueYear.trim()),
    docNumberDate: f.docNumberDate.trim(),
    status: f.status,
    departmentId: f.departmentId,
  };
  const responsiblePerson = opt(f.responsiblePerson);
  const purpose = opt(f.purpose);
  const externalUrl = opt(f.externalUrl);
  if (responsiblePerson !== undefined) payload.responsiblePerson = responsiblePerson;
  if (purpose !== undefined) payload.purpose = purpose;
  if (externalUrl !== undefined) payload.externalUrl = externalUrl;
  return payload;
}

/** PATCH body: only keys whose value changed; a cleared optional field becomes `null`. */
export function diffLegalDocumentPayload(
  next: LegalDocumentPayload,
  prev: LegalDocumentPayload,
): LegalDocumentPatch {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(next), ...Object.keys(prev)]);
  const a = next as unknown as Record<string, unknown>;
  const b = prev as unknown as Record<string, unknown>;
  for (const k of keys) {
    if (a[k] === b[k]) continue;
    out[k] = a[k] === undefined ? null : a[k];
  }
  return out as LegalDocumentPatch;
}

/** Tolerant dashboard: accepts object maps or arrays/groupBy rows, with or without `{ data }`. */
export function toLegalDocumentsDashboard(body: unknown): LegalDocumentsDashboard {
  const raw = unwrap<unknown>(body);
  const r = isRecord(raw) ? raw : {};
  const statusEntries = toCountEntries(r.byStatus, ['status']);
  const fromStatus = (s: string): number =>
    statusEntries.find((e) => e.key.toUpperCase() === s)?.count ?? 0;
  const active = toNum(r.active) ?? toNum(r.activeCount) ?? fromStatus('ACTIVE');
  const inactive = toNum(r.inactive) ?? toNum(r.inactiveCount) ?? fromStatus('INACTIVE');
  const total = toNum(r.total) ?? toNum(r.totalCount) ?? active + inactive;

  const byType = toCountEntries(r.byType, ['docType', 'type', 'key'])
    .filter((e) => (DOC_TYPES as readonly string[]).includes(e.key.toUpperCase()))
    .map((e) => ({ docType: e.key.toUpperCase() as DocType, count: e.count }));

  const deptRaw = Array.isArray(r.byDepartment)
    ? r.byDepartment.map((row) => {
        if (!isRecord(row)) return row;
        const d = isRecord(row.department) ? row.department : {};
        return {
          ...row,
          departmentId: row.departmentId ?? d.id,
          name: row.name ?? row.departmentName ?? d.name,
        };
      })
    : r.byDepartment;
  const byDepartment = toCountEntries(deptRaw, ['departmentId', 'id', 'name'])
    .map((e) => {
      const name = e.row ? (toStr(e.row.name) ?? toStr(e.row.departmentName)) : null;
      return { departmentId: e.key, name: name ?? e.key, count: e.count };
    })
    .sort((x, y) => y.count - x.count);

  return { total, active, inactive, byType, byDepartment };
}
