import type { GcListQuery } from '../api/gc.service';
import { GC_CONTRACT_TYPES, GC_STATUSES } from '../types';

// Must match the accepted sets in the mock handler (src/lib/api/mock/handlers/gc.ts).
export const GC_PAGE_SIZES = [10, 20, 50] as const;
export const GC_SORT_KEYS = ['endDate', 'signedDate', 'title'] as const;

export const DEFAULT_GC_QUERY: Required<Pick<GcListQuery, 'page' | 'pageSize' | 'sort' | 'order'>> &
  GcListQuery = { page: 1, pageSize: 10, sort: 'endDate', order: 'asc' };

function pick<T extends string>(allowed: readonly T[], v: string | null): T | undefined {
  return v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function parseGcListQuery(sp: URLSearchParams): GcListQuery {
  const out: GcListQuery = { ...DEFAULT_GC_QUERY };

  const q = sp.get('q')?.trim();
  if (q) out.q = q;

  const type = pick(GC_CONTRACT_TYPES, sp.get('type'));
  if (type) out.type = type;
  const status = pick(GC_STATUSES, sp.get('status'));
  if (status) out.status = status;

  const pageRaw = sp.get('page');
  if (pageRaw !== null && /^\d+$/.test(pageRaw) && Number(pageRaw) >= 1) {
    out.page = Number(pageRaw);
  }

  const sizeRaw = sp.get('pageSize');
  if (sizeRaw !== null && /^\d+$/.test(sizeRaw)) {
    const size = Number(sizeRaw);
    if ((GC_PAGE_SIZES as readonly number[]).includes(size)) out.pageSize = size;
  }

  out.sort = pick(GC_SORT_KEYS, sp.get('sort')) ?? DEFAULT_GC_QUERY.sort;
  out.order = pick(['asc', 'desc'] as const, sp.get('order')) ?? DEFAULT_GC_QUERY.order;
  return out;
}

export function serializeGcListQuery(q: GcListQuery): string {
  const sp = new URLSearchParams();
  const text = q.q?.trim();
  if (text) sp.set('q', text);
  if (q.type) sp.set('type', q.type);
  if (q.status) sp.set('status', q.status);
  if (q.page !== undefined && q.page !== DEFAULT_GC_QUERY.page) sp.set('page', String(q.page));
  if (q.pageSize !== undefined && q.pageSize !== DEFAULT_GC_QUERY.pageSize) {
    sp.set('pageSize', String(q.pageSize));
  }
  if (q.sort !== undefined && q.sort !== DEFAULT_GC_QUERY.sort) sp.set('sort', q.sort);
  if (q.order !== undefined && q.order !== DEFAULT_GC_QUERY.order) sp.set('order', q.order);
  return sp.toString();
}
