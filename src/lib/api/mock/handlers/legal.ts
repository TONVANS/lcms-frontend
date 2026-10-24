import type MockAdapter from 'axios-mock-adapter';
import { isCaseFinished, sumDual } from '@/features/legal/cases/lib/case-money';
import { casesMockDb } from '@/features/legal/cases/mocks/cases.mock';
import {
  CASE_SORT_KEYS,
  CASE_STAGES,
  CASE_TYPES,
  type CaseInput,
  type CaseSortKey,
  type CaseStage,
  type CaseType,
  type LegalCase,
} from '@/features/legal/cases/types';
import { LEGAL_PAGE_SIZES, LEGAL_UNITS, type LegalUnit } from '@/features/legal/constants';
import type { LegalDashboard } from '@/features/legal/dashboard/types';
import { regulationsMockDb } from '@/features/legal/regulations/mocks/regulations.mock';
import type { RegulationInput } from '@/features/legal/regulations/schemas/regulation.schema';
import {
  REGULATION_SORT_KEYS,
  REGULATION_STATUSES,
  REGULATION_TYPES,
  type Regulation,
  type RegulationSortKey,
  type RegulationStatus,
  type RegulationType,
} from '@/features/legal/regulations/types';
import { hasPermission } from '@/lib/auth/permissions';
import type { Paginated } from '@/types/api';
import type { Permission, User } from '@/types/domain';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

type Reply = [number, unknown?];

const PAGE_SIZES: readonly number[] = LEGAL_PAGE_SIZES;

const REGULATION_DETAIL_RE = /^\/legal\/regulations\/([^/]+)$/;
const CASE_DETAIL_RE = /^\/legal\/cases\/([^/]+)$/;

function authorize(permission: Permission): { user: User } | { reply: Reply } {
  const user = getMockSessionUser();
  if (!user) return { reply: [401, { code: 'UNAUTHENTICATED' }] };
  if (!hasPermission(user, 'legal', permission)) return { reply: [403, { code: 'FORBIDDEN' }] };
  return { user };
}

function parseBody<T>(data: unknown): Partial<T> {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Partial<T>;
    } catch {
      return {};
    }
  }
  return (data ?? {}) as Partial<T>;
}

/** Slice `rows` into the requested page. `pageSize === 'all'` returns every row on page 1. */
function pageOf<T>(rows: T[], page: number, pageSize: number | 'all'): Paginated<T> {
  if (pageSize === 'all') return { items: rows, page: 1, pageSize: rows.length, total: rows.length };
  const start = (page - 1) * pageSize;
  return { items: rows.slice(start, start + pageSize), page, pageSize, total: rows.length };
}

function compareNullsLast(
  a: string | null,
  b: string | null,
  dir: 1 | -1,
  collate = false,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (collate) return a.localeCompare(b, 'lo') * dir;
  return a < b ? -dir : a > b ? dir : 0;
}

function duplicateRegulationReply(): Reply {
  return [
    409,
    {
      code: 'DUPLICATE_REGULATION_NO',
      message: '',
      fieldErrors: { number: 'DUPLICATE_REGULATION_NO' },
    },
  ];
}

function isDuplicateRegulation(number: string | undefined, exceptId?: string): boolean {
  if (!number) return false;
  const needle = number.trim().toLowerCase();
  return regulationsMockDb
    .all()
    .some((r) => r.id !== exceptId && r.number.trim().toLowerCase() === needle);
}

function registerRegulations(mock: MockAdapter): void {
  mock.onGet(endpoints.legal.regulations).reply((config) => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const p = (config.params ?? {}) as Record<string, unknown>;

    const q = typeof p.q === 'string' ? p.q.trim().toLowerCase() : '';
    const type = (REGULATION_TYPES as readonly string[]).includes(p.type as string)
      ? (p.type as RegulationType)
      : undefined;
    const unit = (LEGAL_UNITS as readonly string[]).includes(p.unit as string)
      ? (p.unit as LegalUnit)
      : undefined;
    const status = (REGULATION_STATUSES as readonly string[]).includes(p.status as string)
      ? (p.status as RegulationStatus)
      : undefined;
    const sort: RegulationSortKey = (REGULATION_SORT_KEYS as readonly string[]).includes(
      p.sort as string,
    )
      ? (p.sort as RegulationSortKey)
      : 'issuedDate';
    const dir = p.order === 'asc' ? 1 : -1;
    const pageNum = Math.floor(Number(p.page));
    const page = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1;
    const sizeNum = Number(p.pageSize);
    const pageSize: number | 'all' =
      p.pageSize === 'all' ? 'all' : PAGE_SIZES.includes(sizeNum) ? sizeNum : 10;

    const filtered = regulationsMockDb.all().filter((r) => {
      if (type && r.type !== type) return false;
      if (unit && r.unit !== unit) return false;
      if (status && r.status !== status) return false;
      if (q) {
        const hay = [r.title, r.number, r.responsible ?? ''].join('\n').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    filtered.sort(
      (a: Regulation, b: Regulation) =>
        compareNullsLast(a[sort], b[sort], dir, sort === 'title') ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
    return [200, pageOf(filtered, page, pageSize)];
  });

  mock.onPost(endpoints.legal.regulations).reply((config) => {
    const auth = authorize('create');
    if ('reply' in auth) return auth.reply;
    const body = parseBody<RegulationInput>(config.data);
    if (isDuplicateRegulation(body.number)) return duplicateRegulationReply();
    return [201, regulationsMockDb.insert(body as RegulationInput, auth.user.username)];
  });

  mock.onGet(REGULATION_DETAIL_RE).reply((config) => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const found = regulationsMockDb.get(config.url?.match(REGULATION_DETAIL_RE)?.[1] ?? '');
    return found ? [200, found] : [404, { code: 'NOT_FOUND' }];
  });

  mock.onPatch(REGULATION_DETAIL_RE).reply((config) => {
    const auth = authorize('edit');
    if ('reply' in auth) return auth.reply;
    const id = config.url?.match(REGULATION_DETAIL_RE)?.[1] ?? '';
    if (!regulationsMockDb.get(id)) return [404, { code: 'NOT_FOUND' }];
    const body = parseBody<RegulationInput>(config.data);
    // The record itself is excluded, so saving with its own number is not a duplicate.
    if (isDuplicateRegulation(body.number, id)) return duplicateRegulationReply();
    return [200, regulationsMockDb.update(id, body)];
  });

  mock.onDelete(REGULATION_DETAIL_RE).reply((config) => {
    const auth = authorize('delete');
    if ('reply' in auth) return auth.reply;
    const id = config.url?.match(REGULATION_DETAIL_RE)?.[1] ?? '';
    if (!regulationsMockDb.get(id)) return [404, { code: 'NOT_FOUND' }];
    regulationsMockDb.remove(id);
    return [204];
  });
}

function registerCases(mock: MockAdapter): void {
  mock.onGet(endpoints.legal.cases).reply((config) => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const p = (config.params ?? {}) as Record<string, unknown>;

    const q = typeof p.q === 'string' ? p.q.trim().toLowerCase() : '';
    const caseType = (CASE_TYPES as readonly string[]).includes(p.caseType as string)
      ? (p.caseType as CaseType)
      : undefined;
    const stage = (CASE_STAGES as readonly string[]).includes(p.stage as string)
      ? (p.stage as CaseStage)
      : undefined;
    const progress = p.progress === 'in_progress' || p.progress === 'finished' ? p.progress : undefined;
    const sort: CaseSortKey = (CASE_SORT_KEYS as readonly string[]).includes(p.sort as string)
      ? (p.sort as CaseSortKey)
      : 'disputeDate';
    const dir = p.order === 'asc' ? 1 : -1;
    const pageNum = Math.floor(Number(p.page));
    const page = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1;
    const sizeNum = Number(p.pageSize);
    const pageSize: number | 'all' =
      p.pageSize === 'all' ? 'all' : PAGE_SIZES.includes(sizeNum) ? sizeNum : 10;

    const filtered = casesMockDb.all().filter((c) => {
      if (caseType && c.caseType !== caseType) return false;
      if (stage && c.stage !== stage) return false;
      if (progress === 'in_progress' && isCaseFinished(c.stage)) return false;
      if (progress === 'finished' && !isCaseFinished(c.stage)) return false;
      if (q) {
        const hay = [c.caseNo, c.defendant, c.allegation, c.handlingUnit, c.progress ?? '']
          .join('\n')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    filtered.sort(
      (a: LegalCase, b: LegalCase) =>
        compareNullsLast(a[sort], b[sort], dir, sort === 'defendant') ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
    return [200, pageOf(filtered, page, pageSize)];
  });

  mock.onPost(endpoints.legal.cases).reply((config) => {
    const auth = authorize('create');
    if ('reply' in auth) return auth.reply;
    const body = parseBody<CaseInput>(config.data);
    return [201, casesMockDb.insert(body as CaseInput, auth.user.username)];
  });

  mock.onGet(CASE_DETAIL_RE).reply((config) => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const found = casesMockDb.get(config.url?.match(CASE_DETAIL_RE)?.[1] ?? '');
    return found ? [200, found] : [404, { code: 'NOT_FOUND' }];
  });

  mock.onPatch(CASE_DETAIL_RE).reply((config) => {
    const auth = authorize('edit');
    if ('reply' in auth) return auth.reply;
    const id = config.url?.match(CASE_DETAIL_RE)?.[1] ?? '';
    if (!casesMockDb.get(id)) return [404, { code: 'NOT_FOUND' }];
    const body = parseBody<CaseInput>(config.data);
    return [200, casesMockDb.update(id, body)];
  });

  mock.onDelete(CASE_DETAIL_RE).reply((config) => {
    const auth = authorize('delete');
    if ('reply' in auth) return auth.reply;
    const id = config.url?.match(CASE_DETAIL_RE)?.[1] ?? '';
    if (!casesMockDb.get(id)) return [404, { code: 'NOT_FOUND' }];
    casesMockDb.remove(id);
    return [204];
  });
}

function registerDashboard(mock: MockAdapter): void {
  mock.onGet(endpoints.legal.dashboard).reply(() => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;

    const allRegs = regulationsMockDb.all();
    const byStatus = REGULATION_STATUSES.reduce((acc, s) => {
      acc[s] = allRegs.filter((r) => r.status === s).length;
      return acc;
    }, {} as Record<RegulationStatus, number>);

    const byType = REGULATION_TYPES.map((type) => ({
      type,
      count: allRegs.filter((r) => r.type === type).length,
    }));

    const byUnit = LEGAL_UNITS.map((unit) => ({
      unit,
      count: allRegs.filter((r) => r.unit === unit).length,
    }))
      .filter((u) => u.count > 0)
      .sort((a, b) => b.count - a.count);

    const allCases = casesMockDb.all();
    const finished = allCases.filter((c) => isCaseFinished(c.stage)).length;
    const inProgress = allCases.length - finished;

    const byStage = CASE_STAGES.map((stage) => ({
      stage,
      count: allCases.filter((c) => c.stage === stage).length,
    }));

    const dashboard: LegalDashboard = {
      regulations: {
        total: allRegs.length,
        byStatus,
        unitCount: byUnit.length,
        byType,
        byUnit,
      },
      cases: {
        total: allCases.length,
        inProgress,
        finished,
        byStage,
        damage: sumDual(allCases.map((c) => c.damage)),
        fine: sumDual(allCases.map((c) => c.fine)),
        recovered: sumDual(allCases.map((c) => c.recovered)),
      },
    };

    return [200, dashboard];
  });
}

export function register(mock: MockAdapter): void {
  registerDashboard(mock);
  registerRegulations(mock);
  registerCases(mock);
}
