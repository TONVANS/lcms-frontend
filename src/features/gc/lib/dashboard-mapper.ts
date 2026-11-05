import { toNum, toStr, unwrap } from '@/lib/api/envelope';
import type { ContractStatus, Currency } from '@/types/domain';
import { GC_CURRENCIES, GC_STATUSES, type ContractsDashboard } from '../types';

function rec(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** count | _count | _count._all → number */
function countOf(item: Record<string, unknown>): number {
  const c = item.count ?? item._count;
  const direct = toNum(c);
  if (direct !== null) return direct;
  return toNum(rec(c)._all) ?? 0;
}

function amountOf(item: Record<string, unknown>): number {
  const sum = rec(item._sum);
  return (
    toNum(item.amount) ??
    toNum(item.total) ??
    toNum(item.sum) ??
    toNum(item.totalValue) ??
    toNum(sum.contractValue) ??
    0
  );
}

/** Normalises `{KEY: n}` and `[{<keyName>: KEY, ...}]` into [key, item] pairs. */
function entries(
  raw: unknown,
  keyName: string,
): [string, Record<string, unknown>][] {
  if (Array.isArray(raw)) {
    return raw
      .map((r) => rec(r))
      .map((r): [string, Record<string, unknown>] => [String(r[keyName] ?? ''), r]);
  }
  return Object.entries(rec(raw)).map(([k, v]) => {
    const item = typeof v === 'object' && v !== null ? rec(v) : { count: v, amount: v };
    return [k, item];
  });
}

function pickCurrencies<T>(
  raw: unknown,
  build: (currency: Currency, item: Record<string, unknown>) => T,
): T[] {
  const out: T[] = [];
  for (const [k, item] of entries(raw, 'currency')) {
    const cur = k.toUpperCase();
    if ((GC_CURRENCIES as readonly string[]).includes(cur)) out.push(build(cur as Currency, item));
  }
  return out;
}

export function toContractsDashboard(body: unknown): ContractsDashboard {
  const r = rec(unwrap<unknown>(body));
  const summary = rec(r.summary);

  const rawStatus = r.statusChart ?? r.byStatus ?? r.statusCounts;
  const counts = new Map<ContractStatus, number>(GC_STATUSES.map((s) => [s, 0]));
  for (const [k, item] of entries(rawStatus, 'status')) {
    const s = k.toUpperCase() as ContractStatus;
    if (counts.has(s)) counts.set(s, countOf(item));
  }
  const byStatus = GC_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
  const statusTotal = byStatus.reduce((sum, s) => sum + s.count, 0);

  const rawType = r.typeChart ?? r.byContractType ?? r.contractTypeChart;
  const byContractType = entries(rawType, 'contractTypeId').map(([k, item]) => {
    const nested = rec(item.contractType);
    const isMap = !Array.isArray(rawType);
    const name =
      toStr(item.nameLo) ??
      toStr(item.name) ??
      toStr(item.nameEn) ??
      toStr(nested.nameLo) ??
      (isMap ? k : toStr(item.contractTypeName)) ??
      '';
    return {
      contractTypeId: isMap ? null : toNum(item.contractTypeId),
      name,
      count: countOf(item),
    };
  });

  const rawCurrency = r.currencyChart ?? r.byCurrency;
  const rawValueByCurrency = r.valueByCurrency ?? r.byCurrencyValue ?? r.currencyValueChart;

  const total =
    toNum(summary.totalContracts) ??
    toNum(summary.total) ??
    toNum(r.total) ??
    toNum(r.totalContracts) ??
    statusTotal;

  const expiringSoonCount =
    toNum(summary.expiringSoonCount) ??
    toNum(r.expiringSoonCount) ??
    counts.get('EXPIRING_SOON') ??
    0;

  const expiredCount =
    toNum(summary.expiredCount) ??
    toNum(r.expiredCount) ??
    counts.get('EXPIRED') ??
    0;

  return {
    total,
    expiringSoonCount,
    expiredCount,
    byStatus,
    byCurrency: pickCurrencies(rawCurrency, (currency, item) => ({ currency, count: countOf(item) })),
    valueByCurrency: pickCurrencies(rawValueByCurrency, (currency, item) => ({
      currency,
      amount: amountOf(item),
    })),
    byContractType,
  };
}
