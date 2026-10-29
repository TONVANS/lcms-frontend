import { toIsoDate, toNum, toStr } from '@/lib/api/envelope';
import type { ContractStatus, ContractTypeOption, Currency } from '@/types/domain';
import { GC_CURRENCIES, GC_STATUSES, type Contract } from '../types';

/** Body of POST /contracts (CreateContractDto). PATCH sends a subset. */
export interface ContractPayload {
  title?: string;
  contractTypeId?: number;
  contractNumber?: string;
  durationText?: string;
  durationMonths?: number;
  signedDate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  contractValue?: number;
  currency?: Currency;
  equityOrCapitalContribution?: string;
  sharePercentage?: number;
  implementer?: string;
  additionalDetails?: string;
  notifyDaysBefore?: number;
}

/** Values held by the form (empty text and dates are ''). */
export interface ContractFormInput {
  title: string;
  contractTypeId: number | null;
  contractNumber: string;
  durationText: string;
  durationMonths: number | null;
  signedDate: string;
  effectiveDate: string;
  expirationDate: string;
  contractValue: number | null;
  currency: Currency | null;
  equityOrCapitalContribution: string;
  sharePercentage: number | null;
  implementer: string;
  additionalDetails: string;
  notifyDaysBefore: number | null;
}

function rec(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function toStatus(v: unknown): ContractStatus {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : '';
  return (GC_STATUSES as readonly string[]).includes(s) ? (s as ContractStatus) : 'DRAFT';
}

function toCurrency(v: unknown): Currency | null {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : '';
  return (GC_CURRENCIES as readonly string[]).includes(s) ? (s as Currency) : null;
}

/** Tolerant mapper: Prisma Decimal strings, ISO datetimes, nested or flat contract type. */
export function toContract(raw: unknown): Contract {
  const r = rec(raw);
  const nested = rec(r.contractType);
  const typeId = toNum(r.contractTypeId) ?? toNum(nested.id);
  const flatName = toStr(r.contractTypeName);
  const nestedName = toStr(nested.nameLo) ?? toStr(nested.name);
  const typeName = nestedName ?? flatName;
  const contractType: ContractTypeOption | null =
    typeId !== null && typeName !== null
      ? { id: typeId, nameLo: typeName, nameEn: toStr(nested.nameEn) }
      : null;
  return {
    id: toStr(r.id) ?? '',
    title: toStr(r.title) ?? '',
    contractTypeId: typeId,
    contractType,
    contractNumber: toStr(r.contractNumber) ?? '',
    durationText: toStr(r.durationText),
    durationMonths: toNum(r.durationMonths),
    signedDate: toIsoDate(r.signedDate),
    effectiveDate: toIsoDate(r.effectiveDate),
    expirationDate: toIsoDate(r.expirationDate),
    contractValue: toNum(r.contractValue),
    currency: toCurrency(r.currency),
    equityOrCapitalContribution: toStr(r.equityOrCapitalContribution),
    sharePercentage: toNum(r.sharePercentage),
    implementer: toStr(r.implementer),
    additionalDetails: toStr(r.additionalDetails),
    notifyDaysBefore: toNum(r.notifyDaysBefore),
    status: toStatus(r.status),
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  };
}

function text(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

function num(n: number | null | undefined): number | undefined {
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

/** Form values → DTO body: trimmed, empty values dropped, numbers numeric, dates YYYY-MM-DD. */
export function toContractPayload(f: ContractFormInput): ContractPayload {
  const out: ContractPayload = {
    title: text(f.title),
    contractTypeId: num(f.contractTypeId),
    contractNumber: text(f.contractNumber),
    durationText: text(f.durationText),
    durationMonths: num(f.durationMonths),
    signedDate: toIsoDate(f.signedDate) ?? undefined,
    effectiveDate: toIsoDate(f.effectiveDate) ?? undefined,
    expirationDate: toIsoDate(f.expirationDate) ?? undefined,
    contractValue: num(f.contractValue),
    currency: f.contractValue !== null ? (f.currency ?? undefined) : undefined,
    equityOrCapitalContribution: text(f.equityOrCapitalContribution),
    sharePercentage: num(f.sharePercentage),
    implementer: text(f.implementer),
    additionalDetails: text(f.additionalDetails),
    notifyDaysBefore: num(f.notifyDaysBefore),
  };
  for (const k of Object.keys(out) as (keyof ContractPayload)[]) {
    if (out[k] === undefined) delete out[k];
  }
  return out;
}

/** PATCH body: only the fields of `next` whose value differs from `original`. */
export function diffPayload(original: Contract, next: ContractPayload): ContractPayload {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined) continue;
    const before = (original as unknown as Record<string, unknown>)[k];
    if (before !== v) out[k] = v;
  }
  return out as ContractPayload;
}
