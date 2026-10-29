import { toIsoDate, toNum, toStr } from '@/lib/api/envelope';
import type { AppNotification, NotificationSource } from '../types';

type Rec = Record<string, unknown>;

function rec(v: unknown): Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rec) : {};
}

function first(...vals: unknown[]): string | null {
  for (const v of vals) {
    const s = toStr(v);
    if (s !== null) return s;
  }
  return null;
}

/** Tolerant mapper: backend notification DTOs vary between the two sources. */
export function toNotification(raw: unknown, source: NotificationSource): AppNotification {
  const r = rec(raw);
  const contract = rec(r.contract);
  const power = rec(r.powerContract);
  const nested = source === 'power' ? power : contract;

  const read =
    typeof r.isRead === 'boolean'
      ? r.isRead
      : typeof r.read === 'boolean'
        ? r.read
        : r.readAt != null && r.readAt !== '';

  return {
    id: first(r.id) ?? '',
    source,
    title: first(r.title, r.subject, r.type) ?? '',
    message: first(r.message, r.body, r.content),
    contractId: first(r.contractId, r.powerContractId, contract.id, power.id),
    contractLabel: first(
      nested.contractNumber,
      nested.title,
      nested.projectName,
      contract.contractNumber,
      contract.title,
      power.contractNumber,
      power.projectName,
    ),
    daysLeft: toNum(r.daysLeft ?? r.daysRemaining ?? r.daysBeforeExpiry),
    expirationDate: toIsoDate(
      r.expirationDate ?? contract.expirationDate ?? power.expirationDate,
    ),
    read,
    createdAt: first(r.createdAt) ?? '',
  };
}
