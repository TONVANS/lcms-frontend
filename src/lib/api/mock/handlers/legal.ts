import type MockAdapter from 'axios-mock-adapter';
import {
  legalCasesMockDb,
  nextLegalCaseIds,
  type RawLegalCase,
} from '@/features/legal/cases/mocks/legal-cases.mock';
import { CASE_TYPES, DISPUTE_STATUSES } from '@/features/legal/cases/types';
import {
  legalDocumentsMockDb,
  nextLegalDocumentId,
  type RawLegalDocument,
} from '@/features/legal/documents/mocks/legal-documents.mock';
import { DOC_STATUSES, DOC_TYPES } from '@/features/legal/documents/types';
import { MOCK_DEPARTMENTS } from '@/features/lookups/mocks/lookups.mock';
import { hasPermission, hasSystemModule } from '@/lib/auth/permissions';
import type { Permission, SystemModule, User } from '@/types/domain';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

type Reply = [number, unknown?];
type Body = Record<string, unknown>;

const DOC_DETAIL_RE = /^\/legal-documents\/([^/]+)$/;
const CASE_DETAIL_RE = /^\/legal-cases\/([^/]+)$/;

const nest = (statusCode: number, error: string, message: string | string[]): Reply => [
  statusCode,
  { statusCode, message, error },
];

function authorize(sm: SystemModule, permission: Permission): { user: User } | { reply: Reply } {
  const user = getMockSessionUser();
  if (!user) return { reply: [401, { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }] };
  if (!hasSystemModule(user, sm) || !hasPermission(user, 'legal', permission)) {
    return { reply: nest(403, 'Forbidden', 'Forbidden resource') };
  }
  return { user };
}

function parseBody(data: unknown): Body {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Body;
    } catch {
      return {};
    }
  }
  return (data ?? {}) as Body;
}

const idFrom = (url: string | undefined, re: RegExp): string =>
  decodeURIComponent(url?.match(re)?.[1] ?? '');

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const isBlank = (v: unknown): boolean => typeof v !== 'string' || v.trim() === '';

function paging(p: Record<string, unknown>): { page: number; limit: number } {
  const page = Math.floor(Number(p.page));
  const limit = Math.floor(Number(p.limit));
  return {
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    limit: Number.isFinite(limit) && limit >= 1 ? Math.min(limit, 100) : 10,
  };
}

function pageReply<T>(rows: T[], page: number, limit: number): Reply {
  return [
    200,
    {
      data: rows.slice((page - 1) * limit, page * limit),
      meta: { total: rows.length, page, limit, totalPages: Math.max(1, Math.ceil(rows.length / limit)) },
    },
  ];
}

const byCreatedDesc = <T extends { createdAt: string; id: string | number }>(a: T, b: T): number =>
  b.createdAt.localeCompare(a.createdAt) || String(a.id).localeCompare(String(b.id));

const departmentOf = (id: unknown): { id: string; name: string } | null => {
  const d = MOCK_DEPARTMENTS.find((x) => x.id === id);
  return d ? { id: d.id, name: d.name } : null;
};

// ---------------------------------------------------------------- documents

function validateDocument(body: Body, partial: boolean): string[] {
  const errors: string[] = [];
  const need = (key: string, bad: boolean, text: string) => {
    if (partial && !(key in body)) return;
    if (bad) errors.push(text);
  };
  need('docTitle', isBlank(body.docTitle), 'docTitle should not be empty');
  need('docType', !(DOC_TYPES as readonly string[]).includes(body.docType as string), 'docType must be a valid enum value');
  need('issueYear', !Number.isFinite(Number(body.issueYear)) || body.issueYear === '' || body.issueYear === null, 'issueYear must be a number');
  need('docNumberDate', isBlank(body.docNumberDate), 'docNumberDate should not be empty');
  need('departmentId', isBlank(body.departmentId), 'departmentId should not be empty');
  if (body.status !== undefined && !(DOC_STATUSES as readonly string[]).includes(body.status as string)) {
    errors.push('status must be a valid enum value');
  }
  if (!isBlank(body.departmentId) && !departmentOf(body.departmentId)) {
    errors.push('departmentId must reference an existing department');
  }
  return errors;
}

function registerDocuments(mock: MockAdapter): void {
  const SM = 'legal-documents' as const;

  mock.onGet(endpoints.legalDocuments.dashboard).reply(() => {
    const auth = authorize(SM, 'view');
    if ('reply' in auth) return auth.reply;
    const rows = legalDocumentsMockDb.all();
    const byType: Record<string, number> = {};
    const byDept = new Map<string, { departmentId: string; name: string; count: number }>();
    for (const r of rows) {
      byType[r.docType] = (byType[r.docType] ?? 0) + 1;
      const cur = byDept.get(r.departmentId) ?? { departmentId: r.departmentId, name: r.department.name, count: 0 };
      cur.count += 1;
      byDept.set(r.departmentId, cur);
    }
    const active = rows.filter((r) => r.status === 'ACTIVE').length;
    return [
      200,
      {
        data: {
          total: rows.length,
          active,
          inactive: rows.length - active,
          byType,
          byDepartment: [...byDept.values()].sort((a, b) => b.count - a.count),
        },
      },
    ];
  });

  mock.onGet(endpoints.legalDocuments.list).reply((config) => {
    const auth = authorize(SM, 'view');
    if ('reply' in auth) return auth.reply;
    const p = (config.params ?? {}) as Record<string, unknown>;
    const search = str(p.search).toLowerCase();
    const year = p.issueYear === undefined || p.issueYear === '' ? null : Number(p.issueYear);
    const rows = legalDocumentsMockDb
      .all()
      .filter((r) => {
        if (p.docType && r.docType !== p.docType) return false;
        if (p.status && r.status !== p.status) return false;
        if (year !== null && Number(r.issueYear) !== year) return false;
        if (p.departmentId && r.departmentId !== p.departmentId) return false;
        if (search) {
          const hay = [r.docTitle, r.docNumberDate, r.responsiblePerson ?? '', r.purpose ?? ''].join('\n').toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .sort(byCreatedDesc);
    const { page, limit } = paging(p);
    return pageReply(rows, page, limit);
  });

  mock.onPost(endpoints.legalDocuments.list).reply((config) => {
    const auth = authorize(SM, 'create');
    if ('reply' in auth) return auth.reply;
    const body = parseBody(config.data);
    const errors = validateDocument(body, false);
    if (errors.length > 0) return nest(400, 'Bad Request', errors);
    const now = new Date().toISOString();
    const dept = departmentOf(body.departmentId)!;
    const row: RawLegalDocument = {
      id: nextLegalDocumentId(),
      docTitle: str(body.docTitle),
      docType: body.docType as string,
      issueYear: num(body.issueYear),
      docNumberDate: str(body.docNumberDate),
      status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      responsiblePerson: str(body.responsiblePerson) || null,
      departmentId: dept.id,
      department: dept,
      purpose: str(body.purpose) || null,
      externalUrl: str(body.externalUrl) || null,
      createdAt: now,
      updatedAt: now,
    };
    return [201, { data: legalDocumentsMockDb.insert(row) }];
  });

  mock.onGet(DOC_DETAIL_RE).reply((config) => {
    const auth = authorize(SM, 'view');
    if ('reply' in auth) return auth.reply;
    const found = legalDocumentsMockDb.get(idFrom(config.url, DOC_DETAIL_RE));
    return found ? [200, { data: found }] : nest(404, 'Not Found', 'Legal document not found');
  });

  mock.onPatch(DOC_DETAIL_RE).reply((config) => {
    const auth = authorize(SM, 'edit');
    if ('reply' in auth) return auth.reply;
    const id = idFrom(config.url, DOC_DETAIL_RE);
    if (!legalDocumentsMockDb.get(id)) return nest(404, 'Not Found', 'Legal document not found');
    const body = parseBody(config.data);
    const errors = validateDocument(body, true);
    if (errors.length > 0) return nest(400, 'Bad Request', errors);
    const patch: Partial<RawLegalDocument> = { updatedAt: new Date().toISOString() };
    const text = ['docTitle', 'docNumberDate', 'responsiblePerson', 'purpose', 'externalUrl'] as const;
    for (const k of text) if (k in body) patch[k] = (str(body[k]) || null) as never;
    if ('docType' in body) patch.docType = body.docType as string;
    if ('status' in body) patch.status = body.status as 'ACTIVE' | 'INACTIVE';
    if ('issueYear' in body) patch.issueYear = num(body.issueYear);
    if ('departmentId' in body) {
      const dept = departmentOf(body.departmentId)!;
      patch.departmentId = dept.id;
      patch.department = dept;
    }
    return [200, { data: legalDocumentsMockDb.update(id, patch) }];
  });

  mock.onDelete(DOC_DETAIL_RE).reply((config) => {
    const auth = authorize(SM, 'delete');
    if ('reply' in auth) return auth.reply;
    const id = idFrom(config.url, DOC_DETAIL_RE);
    if (!legalDocumentsMockDb.remove(id)) return nest(404, 'Not Found', 'Legal document not found');
    return [200, { data: { id } }];
  });
}

// -------------------------------------------------------------------- cases

function validateCase(body: Body, partial: boolean): string[] {
  const errors: string[] = [];
  const need = (key: string, bad: boolean, text: string) => {
    if (partial && !(key in body)) return;
    if (bad) errors.push(text);
  };
  need('caseCode', isBlank(body.caseCode), 'caseCode should not be empty');
  need('defendant', isBlank(body.defendant), 'defendant should not be empty');
  need('caseType', !(CASE_TYPES as readonly string[]).includes(body.caseType as string), 'caseType must be a valid enum value');
  need('date', isBlank(body.date) || Number.isNaN(Date.parse(str(body.date))), 'date must be a valid ISO 8601 date string');
  if (body.disputeStatus !== undefined && !(DISPUTE_STATUSES as readonly string[]).includes(body.disputeStatus as string)) {
    errors.push('disputeStatus must be a valid enum value');
  }
  if (body.departmentId && !departmentOf(body.departmentId)) {
    errors.push('departmentId must reference an existing department');
  }
  return errors;
}

const isDuplicateCode = (code: string, exceptId?: string): boolean =>
  legalCasesMockDb
    .all()
    .some((c) => c.internalId !== exceptId && c.caseCode.trim().toLowerCase() === code.trim().toLowerCase());

const conflict = (): Reply => nest(409, 'Conflict', 'Case code already exists');

function registerCases(mock: MockAdapter): void {
  const SM = 'legal-cases' as const;

  mock.onGet(endpoints.legalCases.dashboard).reply(() => {
    const auth = authorize(SM, 'view');
    if ('reply' in auth) return auth.reply;
    const rows = legalCasesMockDb.all();
    const byDisputeStatus: Record<string, number> = {};
    for (const r of rows) byDisputeStatus[r.disputeStatus] = (byDisputeStatus[r.disputeStatus] ?? 0) + 1;
    const sum = (k: keyof RawLegalCase) => rows.reduce((s, r) => s + num(r[k]), 0);
    return [
      200,
      {
        data: {
          total: rows.length,
          byDisputeStatus,
          lak: { damage: sum('damageLak'), fine: sum('fineLak'), totalDue: sum('totalDueLak'), recovered: sum('recoveredLak') },
          usd: { damage: sum('damageUsd'), fine: sum('fineUsd'), totalDue: sum('totalDueUsd'), recovered: sum('recoveredUsd') },
        },
      },
    ];
  });

  mock.onGet(endpoints.legalCases.list).reply((config) => {
    const auth = authorize(SM, 'view');
    if ('reply' in auth) return auth.reply;
    const p = (config.params ?? {}) as Record<string, unknown>;
    const search = str(p.search).toLowerCase();
    const start = str(p.startDate);
    const end = str(p.endDate);
    const rows = legalCasesMockDb
      .all()
      .filter((r) => {
        if (p.caseType && r.caseType !== p.caseType) return false;
        if (p.disputeStatus && r.disputeStatus !== p.disputeStatus) return false;
        if (p.departmentId && r.departmentId !== p.departmentId) return false;
        const day = r.date.slice(0, 10);
        if (start && day < start) return false;
        if (end && day > end) return false;
        if (search) {
          const hay = [r.caseCode, r.defendant, r.allegation ?? '', r.departmentAction ?? '', r.disputeProgress ?? '']
            .join('\n')
            .toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => byCreatedDesc({ ...a, id: a.internalId }, { ...b, id: b.internalId }));
    const { page, limit } = paging(p);
    return pageReply(rows, page, limit);
  });

  mock.onPost(endpoints.legalCases.list).reply((config) => {
    const auth = authorize(SM, 'create');
    if ('reply' in auth) return auth.reply;
    const body = parseBody(config.data);
    const errors = validateCase(body, false);
    if (errors.length > 0) return nest(400, 'Bad Request', errors);
    if (isDuplicateCode(str(body.caseCode))) return conflict();
    const now = new Date().toISOString();
    const dept = body.departmentId ? departmentOf(body.departmentId) : null;
    const damageLak = num(body.damageLak);
    const damageUsd = num(body.damageUsd);
    const fineLak = num(body.fineLak);
    const fineUsd = num(body.fineUsd);
    const row: RawLegalCase = {
      ...nextLegalCaseIds(),
      caseCode: str(body.caseCode),
      defendant: str(body.defendant),
      allegation: str(body.allegation) || null,
      departmentId: dept?.id ?? '',
      department: dept as { id: string; name: string },
      departmentAction: str(body.departmentAction) || null,
      caseType: body.caseType as string,
      damageLak,
      damageUsd,
      fineLak,
      fineUsd,
      totalDueLak: damageLak + fineLak,
      totalDueUsd: damageUsd + fineUsd,
      disputeStatus: (body.disputeStatus as string) ?? 'FIRST_INSTANCE',
      recoveredLak: num(body.recoveredLak),
      recoveredUsd: num(body.recoveredUsd),
      date: `${str(body.date).slice(0, 10)}T00:00:00.000Z`,
      disputeProgress: str(body.disputeProgress) || null,
      externalUrl: str(body.externalUrl) || null,
      createdAt: now,
      updatedAt: now,
    };
    if (!dept) {
      row.departmentId = null as unknown as string;
      row.department = null as unknown as { id: string; name: string };
    }
    return [201, { data: legalCasesMockDb.insert(row) }];
  });

  mock.onGet(CASE_DETAIL_RE).reply((config) => {
    const auth = authorize(SM, 'view');
    if ('reply' in auth) return auth.reply;
    const found = legalCasesMockDb.get(idFrom(config.url, CASE_DETAIL_RE));
    return found ? [200, { data: found }] : nest(404, 'Not Found', 'Legal case not found');
  });

  mock.onPatch(CASE_DETAIL_RE).reply((config) => {
    const auth = authorize(SM, 'edit');
    if ('reply' in auth) return auth.reply;
    const id = idFrom(config.url, CASE_DETAIL_RE);
    const current = legalCasesMockDb.get(id);
    if (!current) return nest(404, 'Not Found', 'Legal case not found');
    const body = parseBody(config.data);
    const errors = validateCase(body, true);
    if (errors.length > 0) return nest(400, 'Bad Request', errors);
    if ('caseCode' in body && isDuplicateCode(str(body.caseCode), id)) return conflict();

    const patch: Partial<RawLegalCase> = { updatedAt: new Date().toISOString() };
    for (const k of ['caseCode', 'defendant'] as const) if (k in body) patch[k] = str(body[k]);
    for (const k of ['allegation', 'departmentAction', 'disputeProgress', 'externalUrl'] as const) {
      if (k in body) patch[k] = str(body[k]) || null;
    }
    if ('caseType' in body) patch.caseType = body.caseType as string;
    if ('disputeStatus' in body) patch.disputeStatus = body.disputeStatus as string;
    if ('date' in body) patch.date = `${str(body.date).slice(0, 10)}T00:00:00.000Z`;
    for (const k of ['damageLak', 'damageUsd', 'fineLak', 'fineUsd', 'recoveredLak', 'recoveredUsd'] as const) {
      if (k in body) patch[k] = num(body[k]);
    }
    if ('departmentId' in body) {
      const dept = body.departmentId ? departmentOf(body.departmentId) : null;
      patch.departmentId = (dept?.id ?? null) as string;
      patch.department = dept as { id: string; name: string };
    }
    const merged = { ...current, ...patch };
    patch.totalDueLak = num(merged.damageLak) + num(merged.fineLak);
    patch.totalDueUsd = num(merged.damageUsd) + num(merged.fineUsd);
    return [200, { data: legalCasesMockDb.update(id, patch) }];
  });

  mock.onDelete(CASE_DETAIL_RE).reply((config) => {
    const auth = authorize(SM, 'delete');
    if ('reply' in auth) return auth.reply;
    const id = idFrom(config.url, CASE_DETAIL_RE);
    if (!legalCasesMockDb.remove(id)) return nest(404, 'Not Found', 'Legal case not found');
    return [200, { data: { id } }];
  });
}

export function register(mock: MockAdapter): void {
  registerDocuments(mock);
  registerCases(mock);
}
