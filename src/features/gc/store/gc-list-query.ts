import type { ContractStatus } from '@/types/domain';
import type { GcListQuery } from '../api/gc.service';
import { GC_PAGE_SIZES, GC_STATUSES } from '../types';

export const DEFAULT_GC_QUERY: GcListQuery & { page: number; pageSize: number } = {
  page: 1,
  pageSize: 10,
};

const posInt = (raw: string | null): number | undefined =>
  raw !== null && /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) && Number(raw) >= 1
    ? Number(raw)
    : undefined;

export function parseGcListQuery(sp: URLSearchParams): GcListQuery {
  const out: GcListQuery = { ...DEFAULT_GC_QUERY };

  const q = sp.get('q')?.trim();
  if (q) out.q = q;

  const status = sp.get('status');
  if (status !== null && (GC_STATUSES as readonly string[]).includes(status)) {
    out.status = status as ContractStatus;
  }

  const typeId = posInt(sp.get('contractTypeId'));
  if (typeId !== undefined) out.contractTypeId = typeId;

  const page = posInt(sp.get('page'));
  if (page !== undefined) out.page = page;

  const size = posInt(sp.get('pageSize'));
  if (size !== undefined && (GC_PAGE_SIZES as readonly number[]).includes(size)) out.pageSize = size;
  return out;
}

export function serializeGcListQuery(q: GcListQuery): string {
  const sp = new URLSearchParams();
  const text = q.q?.trim();
  if (text) sp.set('q', text);
  if (q.status) sp.set('status', q.status);
  if (q.contractTypeId !== undefined) sp.set('contractTypeId', String(q.contractTypeId));
  if (q.page !== undefined && q.page !== DEFAULT_GC_QUERY.page) sp.set('page', String(q.page));
  if (q.pageSize !== undefined && q.pageSize !== DEFAULT_GC_QUERY.pageSize) {
    sp.set('pageSize', String(q.pageSize));
  }
  return sp.toString();
}
