import { toNum, toStr } from '@/lib/api/envelope';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type ContactChannel,
  type SupportTicket,
  type TicketPriority,
  type TicketStatus,
} from '../types';

type Rec = Record<string, unknown>;

function rec(v: unknown): Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rec) : {};
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  const s = toStr(v)?.toUpperCase();
  return (allowed as readonly string[]).includes(s ?? '') ? (s as T) : fallback;
}

/** Tolerant raw → `ContactChannel`; never throws. */
export function toContactChannel(raw: unknown): ContactChannel {
  const r = rec(raw);
  return {
    id: toStr(r.id) ?? '',
    channelName: toStr(r.channelName ?? r.name) ?? '',
    contactInfo: toStr(r.contactInfo ?? r.value) ?? '',
    description: toStr(r.description),
    sortOrder: toNum(r.sortOrder) ?? 0,
    isActive: typeof r.isActive === 'boolean' ? r.isActive : true,
  };
}

export type ContactKind = 'email' | 'phone' | 'text';

/** Decides how a contact value is rendered: `mailto:`, `tel:` or plain text. */
export function contactKind(info: string): ContactKind {
  const s = info.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'email';
  if (/^\+?[\d\s().-]{6,}$/.test(s) && /\d{6,}/.test(s.replace(/\D/g, ''))) return 'phone';
  return 'text';
}

function person(v: unknown): string | null {
  if (typeof v === 'object' && v !== null) {
    const o = v as Rec;
    return toStr(o.fullName ?? o.name ?? o.username);
  }
  return toStr(v);
}

/** Tolerant raw → `SupportTicket`; never throws. */
export function toSupportTicket(raw: unknown): SupportTicket {
  const r = rec(raw);
  const attachment = toStr(r.attachmentUrl ?? r.attachmentPath ?? r.attachment);
  return {
    id: toStr(r.id) ?? '',
    subject: toStr(r.subject ?? r.title) ?? '',
    description: toStr(r.description) ?? '',
    priority: oneOf<TicketPriority>(r.priority, TICKET_PRIORITIES, 'MEDIUM'),
    status: oneOf<TicketStatus>(r.status, TICKET_STATUSES, 'OPEN'),
    adminNote: toStr(r.adminNote),
    hasAttachment: r.hasAttachment === true || attachment !== null,
    createdAt: toStr(r.createdAt) ?? '',
    updatedAt: toStr(r.updatedAt) ?? '',
    createdBy: person(r.createdBy) ?? person(r.user) ?? person(r.createdByUser),
  };
}
