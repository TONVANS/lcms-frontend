import { toIsoDate, toNum, toStr } from '@/lib/api/envelope';
import type { ContractStatus, Currency } from '@/types/domain';
import {
  POWER_CURRENCIES,
  POWER_STATUSES,
  type CapacityUnit,
  type PowerContract,
  type PowerContractType,
  type PowerContractsDashboard,
} from '../types';

type Rec = Record<string, unknown>;

const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

function toStatus(v: unknown): ContractStatus {
  const s = toStr(v)?.toUpperCase().replace(/[\s-]/g, '_');
  return (POWER_STATUSES as readonly string[]).includes(s ?? '') ? (s as ContractStatus) : 'DRAFT';
}

function toType(v: unknown): PowerContractType {
  return toStr(v)?.toUpperCase() === 'SALE' ? 'SALE' : 'PURCHASE';
}

function toUnit(v: unknown): CapacityUnit | null {
  const s = toStr(v)?.toLowerCase();
  if (s === 'mw') return 'MW';
  if (s === 'kw') return 'kW';
  return null;
}

function toCurrency(v: unknown): Currency | null {
  const s = toStr(v)?.toUpperCase();
  return (POWER_CURRENCIES as readonly string[]).includes(s ?? '') ? (s as Currency) : null;
}

/** "150 kW" -> { value: 150, unit: 'kW' }. */
function parseCapacity(text: string | null): { value: number; unit: CapacityUnit } | null {
  const m = text?.match(/^\s*([\d.,]+)\s*(mw|kw)\b/i);
  if (!m) return null;
  const value = toNum(m[1]);
  const unit = toUnit(m[2]);
  return value !== null && unit ? { value, unit } : null;
}

/** "0.065 USD/kWh" -> { value: 0.065, currency: 'USD' }. */
function parseTariff(text: string | null): { value: number; currency: Currency } | null {
  const m = text?.match(/^\s*([\d.,]+)\s*([a-z]{3})\b/i);
  if (!m) return null;
  const value = toNum(m[1]);
  const currency = toCurrency(m[2]);
  return value !== null && currency ? { value, currency } : null;
}

export function toPowerContract(raw: unknown): PowerContract {
  const r: Rec = isRec(raw) ? raw : {};
  const installedCapacity = toStr(r.installedCapacity);
  const tariff = toStr(r.tariff);
  const cap = parseCapacity(installedCapacity);
  const tar = parseTariff(tariff);
  const capacityValue = toNum(r.capacityValue) ?? cap?.value ?? null;
  const tariffValue = toNum(r.tariffValue) ?? tar?.value ?? null;
  return {
    id: toStr(r.id) ?? '',
    contractType: toType(r.contractType),
    contractNumber: toStr(r.contractNumber) ?? '',
    projectName: toStr(r.projectName) ?? '',
    projectTypeOrCustomer: toStr(r.projectTypeOrCustomer) ?? '',
    durationText: toStr(r.durationText),
    durationMonths: toNum(r.durationMonths),
    signedDate: toIsoDate(r.signedDate),
    effectiveDate: toIsoDate(r.effectiveDate),
    expirationDate: toIsoDate(r.expirationDate),
    installedCapacity,
    capacityValue,
    capacityUnit: toUnit(r.capacityUnit) ?? (capacityValue !== null ? (cap?.unit ?? 'MW') : null),
    projectLocation: toStr(r.projectLocation),
    tariff,
    tariffValue,
    tariffCurrency: toCurrency(r.tariffCurrency) ?? tar?.currency ?? null,
    additionalDetails: toStr(r.additionalDetails),
    notifyDaysBefore: toNum(r.notifyDaysBefore),
    status: toStatus(r.status),
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  };
}

export const capacityToMw = (value: number, unit: CapacityUnit | null): number =>
  unit === 'kW' ? value / 1000 : value;

const round = (n: number): number => Math.round(n * 1e6) / 1e6;

/** Count out of `{count}`, `{_count: n}`, `{_count: {_all: n}}`, a bare number or numeric string. */
function countOf(v: unknown): number {
  if (isRec(v)) {
    const c = v.count ?? v._count ?? v.total;
    if (isRec(c)) return toNum(c._all) ?? toNum(c.id) ?? 0;
    return toNum(c) ?? 0;
  }
  return toNum(v) ?? 0;
}

/** Capacity in MW from `capacityMw`, `totalCapacityMw`, `capacityKw`, or value+unit. */
function mwOf(v: unknown): number {
  if (!isRec(v)) return 0;
  const mw = toNum(v.capacityMw) ?? toNum(v.totalCapacityMw) ?? toNum(v.totalMw);
  if (mw !== null) return mw;
  const kw = toNum(v.capacityKw) ?? toNum(v.totalCapacityKw);
  if (kw !== null) return kw / 1000;
  const value = toNum(v.capacityValue) ?? toNum(v.totalCapacityValue);
  return value === null ? 0 : capacityToMw(value, toUnit(v.capacityUnit));
}

function toCountMap(v: unknown, keyNames: string[]): Map<string, number> {
  const out = new Map<string, number>();
  if (Array.isArray(v)) {
    for (const row of v) {
      if (!isRec(row)) continue;
      const key = keyNames.map((k) => toStr(row[k])).find((k) => k !== null);
      if (key) out.set(key, (out.get(key) ?? 0) + countOf(row));
    }
  } else if (isRec(v)) {
    for (const [k, val] of Object.entries(v)) out.set(k, countOf(val));
  }
  return out;
}

export function toPowerContractsDashboard(raw: unknown): PowerContractsDashboard {
  const r: Rec = isRec(raw) ? raw : {};

  const statusCounts = toCountMap(r.byStatus ?? r.statusCounts, ['status']);
  const byStatus = POWER_STATUSES.map((status) => ({ status, count: statusCounts.get(status) ?? 0 }));

  const typeCounts = toCountMap(r.byContractType ?? r.byType, ['contractType', 'type']);
  const purchaseCount = toNum(r.purchaseCount) ?? typeCounts.get('PURCHASE') ?? 0;
  const saleCount = toNum(r.saleCount) ?? typeCounts.get('SALE') ?? 0;

  const rows: unknown[] = [];
  const bp = r.byProjectType ?? r.byProjectTypeOrCustomer;
  if (Array.isArray(bp)) {
    for (const row of bp) rows.push(row);
  } else if (isRec(bp)) {
    for (const [k, v] of Object.entries(bp)) rows.push(isRec(v) ? { projectType: k, ...v } : { projectType: k, count: v });
  }
  const byProjectType = rows.flatMap((row) => {
    if (!isRec(row)) return [];
    const projectType =
      toStr(row.projectType) ?? toStr(row.projectTypeOrCustomer) ?? toStr(row.name) ?? toStr(row.label);
    return projectType ? [{ projectType, count: countOf(row), capacityMw: round(mwOf(row)) }] : [];
  });

  const totalMwDirect = isRec(r) && (r.totalCapacityMw !== undefined || r.totalCapacityKw !== undefined || r.totalCapacityValue !== undefined);
  const totalCapacityMw = round(
    totalMwDirect ? mwOf(r) : byProjectType.reduce((s, p) => s + p.capacityMw, 0),
  );

  const expiringRaw = r.expiringSoon ?? r.expiringContracts ?? r.expiring ?? r.upcoming;
  const expiringSoon = (Array.isArray(expiringRaw) ? expiringRaw : []).map(toPowerContract);

  const totalDirect = toNum(r.total) ?? toNum(r.totalContracts);
  return {
    total: totalDirect ?? byStatus.reduce((s, x) => s + x.count, 0),
    byStatus,
    purchaseCount,
    saleCount,
    totalCapacityMw,
    byProjectType,
    expiringSoon,
  };
}
