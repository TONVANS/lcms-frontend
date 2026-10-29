import type MockAdapter from 'axios-mock-adapter';
import { createContactSeed, createTicketSeed } from '@/features/support/mocks/support.mock';
import { isAdmin } from '@/lib/auth/permissions';
import type { User } from '@/types/domain';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

type Rec = Record<string, unknown>;
type Reply = [number, unknown];

// In-memory (until reload).
const contacts: Rec[] = createContactSeed();
const tickets: Rec[] = createTicketSeed();
let nextContactId = 100;
let nextTicketId = 100;

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// 1x1 transparent PNG served for every attachment.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function attachmentBlob(): Blob {
  const bin = atob(PNG_BASE64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: 'image/png' });
}

const forbidden = (): Reply => [403, { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' }];
const notFound = (): Reply => [404, { statusCode: 404, message: 'Not Found' }];

function auth(): User | Reply {
  const user = getMockSessionUser();
  return user ?? [401, { code: 'UNAUTHENTICATED' }];
}
const isReply = (v: User | Reply): v is Reply => Array.isArray(v);

function admin(): User | Reply {
  const u = auth();
  if (isReply(u)) return u;
  return isAdmin(u) ? u : forbidden();
}

function idFrom(url: string | undefined, re: RegExp): string {
  return decodeURIComponent(url?.match(re)?.[1] ?? '');
}

function visibleTo(user: User, t: Rec): boolean {
  return isAdmin(user) || t.createdById === user.id;
}

function parseBody(data: unknown): Rec {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Rec;
    } catch {
      return {};
    }
  }
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const out: Rec = {};
    data.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  return typeof data === 'object' && data !== null ? (data as Rec) : {};
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

const CONTACT_ID = /\/support\/contacts\/([^/]+)$/;
const TICKET_ID = /\/support\/tickets\/([^/]+)$/;
const ATTACH = /\/support\/tickets\/([^/]+)\/attachment$/;

export function register(mock: MockAdapter): void {
  mock.onGet(endpoints.support.contacts).reply(() => {
    const u = auth();
    if (isReply(u)) return u;
    return [200, { data: contacts.filter((c) => c.isActive !== false) }];
  });

  mock.onPost(endpoints.support.contacts).reply((config) => {
    const u = admin();
    if (isReply(u)) return u;
    const b = parseBody(config.data);
    if (!str(b.channelName) || !str(b.contactInfo)) {
      return [400, { statusCode: 400, message: 'channelName and contactInfo are required', error: 'Bad Request' }];
    }
    const row: Rec = {
      id: nextContactId++,
      channelName: str(b.channelName),
      contactInfo: str(b.contactInfo),
      description: str(b.description) || null,
      sortOrder: typeof b.sortOrder === 'number' ? b.sortOrder : contacts.length + 1,
      isActive: b.isActive !== false,
    };
    contacts.push(row);
    return [201, { data: row }];
  });

  mock.onDelete(new RegExp('/support/contacts/[^/]+$')).reply((config) => {
    const u = admin();
    if (isReply(u)) return u;
    const id = idFrom(config.url, CONTACT_ID);
    const i = contacts.findIndex((c) => String(c.id) === id);
    if (i < 0) return notFound();
    contacts.splice(i, 1);
    return [200, { data: { success: true } }];
  });

  mock.onGet(endpoints.support.tickets).reply((config) => {
    const u = auth();
    if (isReply(u)) return u;
    const p = (config.params ?? {}) as Rec;
    const page = Math.max(1, Number(p.page) || 1);
    const limit = Math.max(1, Number(p.limit) || 10);
    const status = typeof p.status === 'string' && p.status ? p.status : null;
    const rows = tickets
      .filter((t) => visibleTo(u, t) && (!status || t.status === status))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const data = rows.slice((page - 1) * limit, page * limit);
    return [200, { data, meta: { total: rows.length, page, limit, totalPages: Math.ceil(rows.length / limit) } }];
  });

  mock.onPost(endpoints.support.tickets).reply((config) => {
    const u = auth();
    if (isReply(u)) return u;
    const b = parseBody(config.data);
    const priority = str(b.priority) || 'MEDIUM';
    if (!str(b.subject) || !str(b.description) || !PRIORITIES.includes(priority)) {
      return [400, { statusCode: 400, message: 'Invalid ticket', error: 'Bad Request' }];
    }
    const now = new Date().toISOString();
    const hasFile = typeof File !== 'undefined' && b.file instanceof File;
    const id = `t-${nextTicketId++}`;
    const row: Rec = {
      id,
      subject: str(b.subject),
      description: str(b.description),
      priority,
      status: 'OPEN',
      adminNote: null,
      attachmentUrl: hasFile ? `/uploads/support/${id}.png` : str(b.attachmentUrl) || null,
      createdAt: now,
      updatedAt: now,
      createdById: u.id,
      createdBy: { id: u.id, fullName: u.fullName },
    };
    tickets.push(row);
    return [201, { data: row }];
  });

  mock.onGet(new RegExp('/support/tickets/[^/]+/attachment$')).reply((config) => {
    const u = auth();
    if (isReply(u)) return u;
    const t = tickets.find((x) => x.id === idFrom(config.url, ATTACH));
    if (!t || !visibleTo(u, t) || !t.attachmentUrl) return notFound();
    return [200, attachmentBlob()];
  });

  mock.onGet(new RegExp('/support/tickets/[^/]+$')).reply((config) => {
    const u = auth();
    if (isReply(u)) return u;
    const t = tickets.find((x) => x.id === idFrom(config.url, TICKET_ID));
    if (!t || !visibleTo(u, t)) return notFound();
    return [200, { data: t }];
  });

  mock.onPatch(new RegExp('/support/tickets/[^/]+$')).reply((config) => {
    const u = admin();
    if (isReply(u)) return u;
    const t = tickets.find((x) => x.id === idFrom(config.url, TICKET_ID));
    if (!t) return notFound();
    const b = parseBody(config.data);
    if (b.status !== undefined) {
      if (!STATUSES.includes(String(b.status))) {
        return [400, { statusCode: 400, message: 'Invalid status', error: 'Bad Request' }];
      }
      t.status = b.status;
    }
    if (typeof b.adminNote === 'string') t.adminNote = b.adminNote.trim() || null;
    if (typeof b.priority === 'string' && PRIORITIES.includes(b.priority)) t.priority = b.priority;
    t.updatedAt = new Date().toISOString();
    return [200, { data: t }];
  });
}
