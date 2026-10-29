import type { Paginated } from '@/types/api';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** `{ data: T }` → T; raw T passes through. */
export function unwrap<T>(body: unknown): T {
  if (isRecord(body) && 'data' in body) return body.data as T;
  return body as T;
}

/** "1,500" / "1500.00" / 1500 → 1500; ''/null/NaN/garbage → null. */
export function toNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'string') {
    const s = v.replace(/,/g, '').trim();
    if (s === '') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Trims; '' → null. Numbers are stringified. */
export function toStr(v: unknown): string | null {
  if (typeof v === 'string') {
    const s = v.trim();
    return s === '' ? null : s;
  }
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return null;
}

/** '2026-01-15T00:00:00.000Z' → '2026-01-15'. */
export function toIsoDate(v: unknown): string | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}(?:$|[T ])/.test(s)) return s.slice(0, 10);
  if (s === '') return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function totalFrom(...sources: unknown[]): number | null {
  for (const src of sources) {
    if (!isRecord(src)) continue;
    for (const key of ['total', 'totalItems']) {
      const n = toNum(src[key]);
      if (n !== null) return n;
    }
  }
  return null;
}

/**
 * Accepts T[] | {data:T[], meta|pagination} | {data:{items|data, total|meta|pagination}}
 * | {items, total}. Anything else yields an empty page.
 */
export function unwrapPage<T>(
  body: unknown,
  req: { page: number; pageSize: number },
  map: (raw: unknown) => T,
): Paginated<T> {
  let rawItems: unknown[] = [];
  let total: number | null = null;

  if (Array.isArray(body)) {
    rawItems = body;
  } else if (isRecord(body)) {
    const d = body.data;
    if (Array.isArray(d)) {
      rawItems = d;
      total = totalFrom(body.meta, body.pagination, body);
    } else if (isRecord(d)) {
      const inner = Array.isArray(d.items) ? d.items : Array.isArray(d.data) ? d.data : [];
      rawItems = inner;
      total = totalFrom(d, d.meta, d.pagination, body.meta, body.pagination);
    } else if (Array.isArray(body.items)) {
      rawItems = body.items;
      total = totalFrom(body, body.meta, body.pagination);
    }
  }

  const items = rawItems.map(map);
  return { items, page: req.page, pageSize: req.pageSize, total: total ?? items.length };
}
