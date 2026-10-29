import type MockAdapter from 'axios-mock-adapter';
import { gcMockDb, type RawContract } from '@/features/gc/mocks/gc.mock';
import { GC_CURRENCIES, GC_STATUSES } from '@/features/gc/types';
import { MOCK_CONTRACT_TYPES } from '@/features/lookups/mocks/lookups.mock';
import { hasPermission } from '@/lib/auth/permissions';
import type { Permission, User } from '@/types/domain';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

type Reply = [number, unknown?];

const DETAIL_RE = /^\/contracts\/([^/?]+)$/;

const nest = (statusCode: number, message: string | string[], error: string) => ({
  statusCode,
  message,
  error,
});

function authorize(permission: Permission): { user: User } | { reply: Reply } {
  const user = getMockSessionUser();
  if (!user) return { reply: [401, nest(401, 'Unauthorized', 'Unauthorized')] };
  if (!hasPermission(user, 'gc', permission)) {
    return { reply: [403, nest(403, 'Forbidden resource', 'Forbidden')] };
  }
  return { user };
}

function parseBody(data: unknown): Partial<RawContract> {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Partial<RawContract>;
    } catch {
      return {};
    }
  }
  return (data ?? {}) as Partial<RawContract>;
}

function validate(body: Partial<RawContract>, partial: boolean): string[] {
  const errors: string[] = [];
  const blank = (v: unknown) => typeof v !== 'string' || v.trim() === '';
  if (!partial || 'title' in body) if (blank(body.title)) errors.push('title should not be empty');
  if (!partial || 'contractNumber' in body) {
    if (blank(body.contractNumber)) errors.push('contractNumber should not be empty');
  }
  if (!partial || 'contractTypeId' in body) {
    const id = Number(body.contractTypeId);
    if (!Number.isFinite(id) || !MOCK_CONTRACT_TYPES.some((t) => t.id === id)) {
      errors.push('contractTypeId must be a number between 1 and 14');
    }
  }
  if (body.currency != null && !(GC_CURRENCIES as readonly string[]).includes(body.currency)) {
    errors.push('currency must be one of the following values: LAK, USD, CNY');
  }
  return errors;
}

function isDuplicate(num: string | undefined, exceptId?: string): boolean {
  if (!num) return false;
  const needle = num.trim().toLowerCase();
  return gcMockDb
    .all()
    .some((c) => c.id !== exceptId && c.contractNumber.trim().toLowerCase() === needle);
}

const duplicate = (): Reply => [409, nest(409, 'Contract number already exists', 'Conflict')];

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function register(mock: MockAdapter): void {
  // Registered before the detail route so "dashboard" is never read as an id.
  mock.onGet(endpoints.contracts.dashboard).reply(() => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const all = gcMockDb.all();
    const byStatus = Object.fromEntries(
      GC_STATUSES.map((s) => [s, all.filter((c) => c.status === s).length]),
    );
    const byCurrency = GC_CURRENCIES.map((currency) => ({
      currency,
      _count: { _all: all.filter((c) => c.currency === currency).length },
    }));
    const valueByCurrency = GC_CURRENCIES.map((currency) => ({
      currency,
      _sum: {
        contractValue: String(
          all.filter((c) => c.currency === currency).reduce((s, c) => s + num(c.contractValue), 0),
        ),
      },
    }));
    const byContractType = MOCK_CONTRACT_TYPES.map((t) => ({
      contractTypeId: t.id,
      name: t.nameLo,
      count: all.filter((c) => c.contractTypeId === t.id).length,
    })).filter((t) => t.count > 0);
    return [
      200,
      {
        data: {
          total: all.length,
          expiringSoonCount: byStatus.EXPIRING_SOON,
          expiredCount: byStatus.EXPIRED,
          byStatus,
          byCurrency,
          valueByCurrency,
          byContractType,
        },
      },
    ];
  });

  mock.onGet(endpoints.contracts.list).reply((config) => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const p = (config.params ?? {}) as Record<string, unknown>;
    const search = typeof p.search === 'string' ? p.search.trim().toLowerCase() : '';
    const status = (GC_STATUSES as readonly string[]).includes(p.status as string)
      ? (p.status as string)
      : undefined;
    const typeId = p.contractTypeId === undefined ? undefined : Number(p.contractTypeId);
    const pageNum = Math.floor(Number(p.page));
    const page = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1;
    const limNum = Math.floor(Number(p.limit));
    const limit = Number.isFinite(limNum) && limNum >= 1 ? Math.min(limNum, 100) : 10;

    const filtered = gcMockDb.all().filter((c) => {
      if (status && c.status !== status) return false;
      if (typeId !== undefined && c.contractTypeId !== typeId) return false;
      if (search && !`${c.title}\n${c.contractNumber}`.toLowerCase().includes(search)) return false;
      return true;
    });
    const start = (page - 1) * limit;
    return [
      200,
      {
        data: filtered.slice(start, start + limit),
        meta: { total: filtered.length, page, limit, totalPages: Math.max(1, Math.ceil(filtered.length / limit)) },
      },
    ];
  });

  mock.onPost(endpoints.contracts.list).reply((config) => {
    const auth = authorize('create');
    if ('reply' in auth) return auth.reply;
    const body = parseBody(config.data);
    const errors = validate(body, false);
    if (errors.length > 0) return [400, nest(400, errors, 'Bad Request')];
    if (isDuplicate(body.contractNumber)) return duplicate();
    return [201, { data: gcMockDb.insert(body) }];
  });

  mock.onGet(DETAIL_RE).reply((config) => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const found = gcMockDb.get(config.url?.match(DETAIL_RE)?.[1] ?? '');
    return found ? [200, { data: found }] : [404, nest(404, 'Contract not found', 'Not Found')];
  });

  mock.onPatch(DETAIL_RE).reply((config) => {
    const auth = authorize('edit');
    if ('reply' in auth) return auth.reply;
    const id = config.url?.match(DETAIL_RE)?.[1] ?? '';
    if (!gcMockDb.get(id)) return [404, nest(404, 'Contract not found', 'Not Found')];
    const body = parseBody(config.data);
    const errors = validate(body, true);
    if (errors.length > 0) return [400, nest(400, errors, 'Bad Request')];
    if (isDuplicate(body.contractNumber, id)) return duplicate();
    return [200, { data: gcMockDb.update(id, body) }];
  });

  mock.onDelete(DETAIL_RE).reply((config) => {
    const auth = authorize('delete');
    if ('reply' in auth) return auth.reply;
    const id = config.url?.match(DETAIL_RE)?.[1] ?? '';
    if (!gcMockDb.remove(id)) return [404, nest(404, 'Contract not found', 'Not Found')];
    return [200, { data: { id } }];
  });
}
