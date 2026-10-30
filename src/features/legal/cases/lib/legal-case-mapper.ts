import { toNum, toStr, toIsoDate, unwrap } from '@/lib/api/envelope';
import { toDepartment } from '../../documents/lib/legal-document-mapper';
import { isRecord, pickEnum, toCountEntries } from '@/lib/api/mapper-utils';
import type { LegalCaseFormValues } from '../schemas/legal-case.schema';
import {
  CASE_TYPES,
  DISPUTE_STATUSES,
  type Currency2,
  type DisputeStatus,
  type LegalCase,
  type LegalCasePatch,
  type LegalCasePayload,
  type LegalCasesDashboard,
  type MoneyTotals,
} from '../types';

/** Tolerant: a backend row (Decimal strings, ISO datetimes, nested department) -> model. */
export function toLegalCase(raw: unknown): LegalCase {
  const r = isRecord(raw) ? raw : {};
  const department = toDepartment(r.department);
  return {
    id: toStr(r.internalId) ?? toStr(r.id) ?? '',
    caseCode: toStr(r.caseCode) ?? '',
    defendant: toStr(r.defendant) ?? '',
    allegation: toStr(r.allegation),
    departmentId: toStr(r.departmentId) ?? department?.id ?? null,
    department,
    departmentAction: toStr(r.departmentAction),
    caseType: pickEnum(r.caseType, CASE_TYPES, 'OTHER'),
    damageLak: toNum(r.damageLak),
    damageUsd: toNum(r.damageUsd),
    fineLak: toNum(r.fineLak),
    fineUsd: toNum(r.fineUsd),
    totalDueLak: toNum(r.totalDueLak),
    totalDueUsd: toNum(r.totalDueUsd),
    disputeStatus: pickEnum(r.disputeStatus, DISPUTE_STATUSES, 'FIRST_INSTANCE'),
    recoveredLak: toNum(r.recoveredLak),
    recoveredUsd: toNum(r.recoveredUsd),
    date: toIsoDate(r.date),
    disputeProgress: toStr(r.disputeProgress),
    externalUrl: toStr(r.externalUrl),
    createdAt: toStr(r.createdAt) ?? '',
    updatedAt: toStr(r.updatedAt) ?? '',
  };
}

const opt = (s: string): string | undefined => {
  const t = s.trim();
  return t === '' ? undefined : t;
};

/** Form -> DTO. Amounts default to 0, dates stay YYYY-MM-DD, totalDue* is never sent. */
export function toLegalCasePayload(f: LegalCaseFormValues): LegalCasePayload {
  const payload: LegalCasePayload = {
    caseCode: f.caseCode.trim(),
    defendant: f.defendant.trim(),
    caseType: f.caseType,
    disputeStatus: f.disputeStatus,
    date: f.date.slice(0, 10),
    damageLak: f.damageLak ?? 0,
    damageUsd: f.damageUsd ?? 0,
    fineLak: f.fineLak ?? 0,
    fineUsd: f.fineUsd ?? 0,
    recoveredLak: f.recoveredLak ?? 0,
    recoveredUsd: f.recoveredUsd ?? 0,
  };
  const allegation = opt(f.allegation);
  const departmentId = f.departmentId === '' ? undefined : f.departmentId;
  const departmentAction = opt(f.departmentAction);
  const disputeProgress = opt(f.disputeProgress);
  const externalUrl = opt(f.externalUrl);
  if (allegation !== undefined) payload.allegation = allegation;
  if (departmentId !== undefined) payload.departmentId = departmentId;
  if (departmentAction !== undefined) payload.departmentAction = departmentAction;
  if (disputeProgress !== undefined) payload.disputeProgress = disputeProgress;
  if (externalUrl !== undefined) payload.externalUrl = externalUrl;
  return payload;
}

/** PATCH body: only changed keys; a cleared optional field becomes `null`. */
export function diffLegalCasePayload(next: LegalCasePayload, prev: LegalCasePayload): LegalCasePatch {
  const out: Record<string, unknown> = {};
  const a = next as unknown as Record<string, unknown>;
  const b = prev as unknown as Record<string, unknown>;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (a[k] === b[k]) continue;
    out[k] = a[k] === undefined ? null : a[k];
  }
  return out as LegalCasePatch;
}

/** Total due: the server value when present, otherwise damage + fine. */
export function caseTotalDue(c: LegalCase, cur: Currency2): number | null {
  const server = cur === 'lak' ? c.totalDueLak : c.totalDueUsd;
  if (server !== null) return server;
  const damage = cur === 'lak' ? c.damageLak : c.damageUsd;
  const fine = cur === 'lak' ? c.fineLak : c.fineUsd;
  if (damage === null && fine === null) return null;
  return (damage ?? 0) + (fine ?? 0);
}

export function isCaseFinished(s: DisputeStatus): boolean {
  return s === 'CLOSED' || s === 'RESOLVED';
}


const SOURCE_KEYS = ['totals', 'total', 'summary', 'amounts', 'money', 'sums', '_sum'];

function moneyFor(r: Record<string, unknown>, cur: Currency2): MoneyTotals {
  const cap = cur === 'lak' ? 'Lak' : 'Usd';
  const sources: Record<string, unknown>[] = [r];
  for (const k of SOURCE_KEYS) if (isRecord(r[k])) sources.push(r[k] as Record<string, unknown>);
  for (const s of [...sources]) {
    const nested = s[cur];
    if (isRecord(nested)) sources.push(nested);
  }
  const find = (metric: string): number | null => {
    const mc = metric.charAt(0).toUpperCase() + metric.slice(1);
    for (const s of sources) {
      for (const key of [metric, `${metric}${cap}`, `total${mc}${cap}`, `${cur}${mc}`, `sum${mc}${cap}`]) {
        const n = toNum(s[key]);
        if (n !== null) return n;
      }
    }
    return null;
  };
  const damage = find('damage') ?? 0;
  const fine = find('fine') ?? 0;
  return {
    damage,
    fine,
    totalDue: find('totalDue') ?? damage + fine,
    recovered: find('recovered') ?? 0,
  };
}

/** Tolerant dashboard: object maps or groupBy rows, flat or nested money totals. */
export function toLegalCasesDashboard(body: unknown): LegalCasesDashboard {
  const raw = unwrap<unknown>(body);
  const r = isRecord(raw) ? raw : {};
  const entries = toCountEntries(r.byDisputeStatus ?? r.byStatus, ['disputeStatus', 'status', 'key']);
  const counts = new Map<string, number>(entries.map((e) => [e.key.toUpperCase(), e.count]));
  const byDisputeStatus = DISPUTE_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
  const total =
    toNum(r.total) ?? toNum(r.totalCases) ?? byDisputeStatus.reduce((sum, e) => sum + e.count, 0);
  return { total, byDisputeStatus, lak: moneyFor(r, 'lak'), usd: moneyFor(r, 'usd') };
}
