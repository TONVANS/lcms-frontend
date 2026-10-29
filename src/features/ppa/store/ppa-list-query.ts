import { POWER_CONTRACT_TYPES, POWER_PAGE_SIZES, POWER_STATUSES, type PowerListQuery } from '../types';

export const DEFAULT_POWER_QUERY: PowerListQuery = { page: 1, pageSize: 10 };

function pick<T extends string>(allowed: readonly T[], v: string | null): T | undefined {
  return v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function parsePowerListQuery(sp: URLSearchParams): PowerListQuery {
  const out: PowerListQuery = { ...DEFAULT_POWER_QUERY };
  const q = sp.get('q')?.trim();
  if (q) out.q = q;
  const type = pick(POWER_CONTRACT_TYPES, sp.get('type'));
  if (type) out.contractType = type;
  const status = pick(POWER_STATUSES, sp.get('status'));
  if (status) out.status = status;
  const project = sp.get('project')?.trim();
  if (project) out.projectTypeOrCustomer = project;

  const pageRaw = sp.get('page');
  if (pageRaw !== null && /^\d+$/.test(pageRaw) && Number.isSafeInteger(Number(pageRaw)) && Number(pageRaw) >= 1) {
    out.page = Number(pageRaw);
  }
  const sizeRaw = sp.get('pageSize');
  if (sizeRaw !== null && /^\d+$/.test(sizeRaw) && (POWER_PAGE_SIZES as readonly number[]).includes(Number(sizeRaw))) {
    out.pageSize = Number(sizeRaw);
  }
  return out;
}

export function serializePowerListQuery(q: PowerListQuery): string {
  const sp = new URLSearchParams();
  const text = q.q?.trim();
  if (text) sp.set('q', text);
  if (q.contractType) sp.set('type', q.contractType);
  if (q.status) sp.set('status', q.status);
  const project = q.projectTypeOrCustomer?.trim();
  if (project) sp.set('project', project);
  if (q.page !== undefined && q.page !== DEFAULT_POWER_QUERY.page) sp.set('page', String(q.page));
  if (q.pageSize !== undefined && q.pageSize !== DEFAULT_POWER_QUERY.pageSize) {
    sp.set('pageSize', String(q.pageSize));
  }
  return sp.toString();
}
