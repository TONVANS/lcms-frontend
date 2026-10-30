import { toStr } from '@/lib/api/envelope';
import { toHistoryEntry } from '@/features/history';
import type { AuditChange, AuditLog } from '../types';

type Rec = Record<string, unknown>;

function rec(v: unknown): Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rec) : {};
}

/** Object, or a JSON string holding an object; anything else yields {}. */
function asObject(v: unknown): Rec {
  if (typeof v === 'string') {
    try {
      return rec(JSON.parse(v));
    } catch {
      return {};
    }
  }
  return rec(v);
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return toStr(v);
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

function diff(oldV: Rec, newV: Rec): AuditChange[] {
  const keys = [...new Set([...Object.keys(oldV), ...Object.keys(newV)])];
  const out: AuditChange[] = [];
  for (const field of keys) {
    const o = str(oldV[field]);
    const n = str(newV[field]);
    if (o === n) continue;
    out.push({ field, label: field, oldValue: o, newValue: n });
  }
  return out;
}

function pickStr(r: Rec, ...keys: string[]): string | null {
  for (const k of keys) {
    const s = toStr(r[k]);
    if (s) return s;
  }
  return null;
}

function userOf(r: Rec): { id: string | null; name: string | null } {
  const u = rec(r.user);
  return {
    id: pickStr(r, 'userId') ?? toStr(u.id),
    name: toStr(u.fullName) ?? toStr(u.name) ?? toStr(u.username) ?? pickStr(r, 'userName', 'performedBy'),
  };
}

function targetLabel(r: Rec): string | null {
  const c = rec(r.contract);
  return (
    pickStr(r, 'targetLabel') ??
    toStr(c.contractNumber) ??
    toStr(c.title) ??
    pickStr(r, 'description')
  );
}

/** Tolerant raw → `AuditLog`; never throws. */
export function toAuditLog(raw: unknown): AuditLog {
  const r = rec(raw);
  const user = userOf(r);
  const oldV = asObject(r.oldValues);
  const newV = asObject(r.newValues);
  let changes = diff(oldV, newV);
  if (changes.length === 0 && r.changes !== undefined) changes = toHistoryEntry({ changes: r.changes }).changes;
  return {
    id: toStr(r.id) ?? '',
    action: toStr(r.action) ?? '',
    createdAt: toStr(r.createdAt) ?? '',
    userId: user.id,
    userName: user.name,
    targetType: pickStr(r, 'targetType', 'entityType', 'resource', 'module'),
    targetId: pickStr(r, 'targetId', 'entityId', 'contractId'),
    targetLabel: targetLabel(r),
    ipAddress: pickStr(r, 'ipAddress', 'ip'),
    changes,
  };
}
