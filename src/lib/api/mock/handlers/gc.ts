import type MockAdapter from 'axios-mock-adapter';
import { deriveGcStatus } from '@/features/gc/lib/derive-status';
import { gcMockDb } from '@/features/gc/mocks/gc.mock';
import type { GcContractInput } from '@/features/gc/schemas/gc.schema';
import {
  GC_CONTRACT_TYPES,
  GC_CURRENCIES,
  GC_PAGE_SIZES,
  GC_SORT_KEYS,
  GC_STATUSES,
  type GcContractType,
  type GcSortKey,
  type GcStatus,
  type GeneralContract,
} from '@/features/gc/types';
import { hasPermission } from '@/lib/auth/permissions';
import { daysLeft } from '@/lib/utils/date';
import type { Paginated } from '@/types/api';
import type { Permission, User } from '@/types/domain';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

type Reply = [number, unknown?];

const PAGE_SIZES: readonly number[] = GC_PAGE_SIZES;
const SORT_KEYS = GC_SORT_KEYS;
type SortKey = GcSortKey;

const DETAIL_RE = /^\/contracts\/([^/]+)$/;

function authorize(permission: Permission): { user: User } | { reply: Reply } {
  const user = getMockSessionUser();
  if (!user) return { reply: [401, { code: 'UNAUTHENTICATED' }] };
  if (!hasPermission(user, 'gc', permission)) return { reply: [403, { code: 'FORBIDDEN' }] };
  return { user };
}

function parseBody(data: unknown): Partial<GcContractInput> {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Partial<GcContractInput>;
    } catch {
      return {};
    }
  }
  return (data ?? {}) as Partial<GcContractInput>;
}

function duplicateReply(): Reply {
  return [
    409,
    {
      code: 'DUPLICATE_CONTRACT_NO',
      message: '',
      fieldErrors: { contractNo: 'DUPLICATE_CONTRACT_NO' },
    },
  ];
}

function isDuplicate(contractNo: string | undefined, exceptId?: string): boolean {
  if (!contractNo) return false;
  const needle = contractNo.trim().toLowerCase();
  return gcMockDb
    .all()
    .some((c) => c.id !== exceptId && c.contractNo.trim().toLowerCase() === needle);
}

function compareNullsLast(a: string | null, b: string | null, dir: 1 | -1): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -dir : a > b ? dir : 0;
}

export function register(mock: MockAdapter): void {
  // Registered before the detail route so "dashboard" is never read as an id.
  mock.onGet(endpoints.gc.dashboard).reply(() => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const all = gcMockDb.all();
    const today = new Date();
    const byStatus = Object.fromEntries(GC_STATUSES.map((s) => [s, 0])) as Record<GcStatus, number>;
    for (const c of all) byStatus[deriveGcStatus(c, today)] += 1;
    const byType = GC_CONTRACT_TYPES.map((type) => ({
      type,
      count: all.filter((c) => c.type === type).length,
    }));
    const valueTotals = GC_CURRENCIES.map((currency) => {
      const withValue = all.filter((c) => c.value?.currency === currency);
      return {
        currency,
        amount: withValue.reduce((sum, c) => sum + (c.value?.amount ?? 0), 0),
        count: withValue.length,
      };
    });
    const upcoming = all
      .filter((c) => {
        const left = daysLeft(c.endDate, today);
        return left !== null && left >= 0 && left <= 90;
      })
      .sort((a, b) => compareNullsLast(a.endDate, b.endDate, 1));
    return [200, { total: all.length, byStatus, byType, valueTotals, upcoming }];
  });

  mock.onGet(endpoints.gc.list).reply((config) => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const p = (config.params ?? {}) as Record<string, unknown>;
    const today = new Date();

    const q = typeof p.q === 'string' ? p.q.trim().toLowerCase() : '';
    const type = (GC_CONTRACT_TYPES as readonly string[]).includes(p.type as string)
      ? (p.type as GcContractType)
      : undefined;
    const status = (GC_STATUSES as readonly string[]).includes(p.status as string)
      ? (p.status as GcStatus)
      : undefined;
    const sort: SortKey = (SORT_KEYS as readonly string[]).includes(p.sort as string)
      ? (p.sort as SortKey)
      : 'endDate';
    const dir = p.order === 'desc' ? -1 : 1;
    const pageNum = Math.floor(Number(p.page));
    const page = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1;
    const sizeNum = Number(p.pageSize);
    const pageSize = PAGE_SIZES.includes(sizeNum) ? sizeNum : 10;

    const filtered = gcMockDb.all().filter((c) => {
      if (type && c.type !== type) return false;
      if (status && deriveGcStatus(c, today) !== status) return false;
      if (q) {
        const hay = [c.title, c.contractNo, c.counterparty ?? ''].join('\n').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    filtered.sort((a: GeneralContract, b: GeneralContract) =>
      compareNullsLast(a[sort], b[sort], dir),
    );
    const start = (page - 1) * pageSize;
    const body: Paginated<GeneralContract> = {
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total: filtered.length,
    };
    return [200, body];
  });

  mock.onPost(endpoints.gc.list).reply((config) => {
    const auth = authorize('create');
    if ('reply' in auth) return auth.reply;
    const body = parseBody(config.data);
    if (isDuplicate(body.contractNo)) return duplicateReply();
    return [201, gcMockDb.insert(body as GcContractInput, auth.user.username)];
  });

  mock.onGet(DETAIL_RE).reply((config) => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const found = gcMockDb.get(config.url?.match(DETAIL_RE)?.[1] ?? '');
    return found ? [200, found] : [404, { code: 'NOT_FOUND' }];
  });

  mock.onPatch(DETAIL_RE).reply((config) => {
    const auth = authorize('edit');
    if ('reply' in auth) return auth.reply;
    const id = config.url?.match(DETAIL_RE)?.[1] ?? '';
    if (!gcMockDb.get(id)) return [404, { code: 'NOT_FOUND' }];
    const body = parseBody(config.data);
    // The record itself is excluded, so saving with its own number is not a duplicate.
    if (isDuplicate(body.contractNo, id)) return duplicateReply();
    return [200, gcMockDb.update(id, body)];
  });

  mock.onDelete(DETAIL_RE).reply((config) => {
    const auth = authorize('delete');
    if ('reply' in auth) return auth.reply;
    const id = config.url?.match(DETAIL_RE)?.[1] ?? '';
    if (!gcMockDb.get(id)) return [404, { code: 'NOT_FOUND' }];
    gcMockDb.remove(id);
    return [204];
  });
}
