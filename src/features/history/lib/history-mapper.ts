import { toStr } from '@/lib/api/envelope';
import type { HistoryEntry } from '@/types/domain';

type Rec = Record<string, unknown>;
type Change = HistoryEntry['changes'][number];

function rec(raw: unknown): Rec {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Rec) : {};
}

/** null / undefined / '' → null; objects are JSON-stringified. */
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

function pick(r: Rec, ...keys: string[]): unknown {
  for (const k of keys) if (r[k] !== undefined) return r[k];
  return undefined;
}

function toChange(field: string, r: Rec): Change {
  return {
    field,
    label: toStr(pick(r, 'label', 'fieldLabel', 'fieldLo')) ?? field,
    oldValue: str(pick(r, 'oldValue', 'old', 'from')),
    newValue: str(pick(r, 'newValue', 'new', 'to')),
  };
}

function toChanges(raw: unknown): Change[] {
  if (Array.isArray(raw)) {
    return raw.map((c) => {
      const r = rec(c);
      return toChange(toStr(r.field) ?? '', r);
    });
  }
  if (typeof raw === 'object' && raw !== null) {
    return Object.entries(raw as Rec).map(([field, v]) => toChange(field, rec(v)));
  }
  return [];
}

function userName(r: Rec): string | null {
  const u = r.user;
  if (typeof u === 'object' && u !== null) {
    const o = u as Rec;
    const name = toStr(o.fullName ?? o.name ?? o.username);
    if (name) return name;
  } else if (typeof u === 'string') {
    const name = toStr(u);
    if (name) return name;
  }
  return toStr(r.userName ?? r.performedBy);
}

/** Tolerant raw → `HistoryEntry`; never throws. */
export function toHistoryEntry(raw: unknown): HistoryEntry {
  const r = rec(raw);
  return {
    id: toStr(r.id) ?? '',
    action: toStr(r.action) ?? '',
    createdAt: toStr(r.createdAt) ?? '',
    userName: userName(r),
    changes: toChanges(r.changes),
  };
}
