import type MockAdapter from 'axios-mock-adapter';
import { toPowerContract } from '@/features/ppa/lib/power-contract-mapper';
import { powerMockDb, type RawPowerContract } from '@/features/ppa/mocks/ppa.mock';
import { POWER_STATUSES } from '@/features/ppa/types';
import { hasPermission } from '@/lib/auth/permissions';
import { daysLeft } from '@/lib/utils/date';
import type { Permission, User } from '@/types/domain';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

type Reply = [number, unknown?];

const DETAIL_RE = /^\/power-contracts\/(?!dashboard$|project-types$)([^/?]+)$/;
const DATE_FIELDS = ['signedDate', 'effectiveDate', 'expirationDate'] as const;
const NUM_FIELDS = ['durationMonths', 'capacityValue', 'tariffValue', 'notifyDaysBefore'] as const;

const badRequest = (message: string[]): Reply => [
  400,
  { statusCode: 400, message, error: 'Bad Request' },
];

function authorize(permission: Permission): { user: User } | { reply: Reply } {
  const user = getMockSessionUser();
  if (!user) return { reply: [401, { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }] };
  if (!hasPermission(user, 'ppa', permission)) {
    return { reply: [403, { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' }] };
  }
  return { user };
}

function parseBody(data: unknown): Record<string, unknown> {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (data ?? {}) as Record<string, unknown>;
}

function validate(body: Record<string, unknown>, partial: boolean): string[] {
  const errors: string[] = [];
  const required = (key: string) => {
    const v = body[key];
    if (typeof v !== 'string' || v.trim() === '') errors.push(`${key} should not be empty`);
  };
  if (!partial || 'contractType' in body) {
    if (body.contractType !== 'PURCHASE' && body.contractType !== 'SALE') {
      errors.push('contractType must be one of the following values: PURCHASE, SALE');
    }
  }
  if (!partial || 'projectName' in body) required('projectName');
  if (!partial || 'projectTypeOrCustomer' in body) required('projectTypeOrCustomer');
  for (const key of NUM_FIELDS) {
    if (key in body && body[key] !== null && typeof body[key] !== 'number') {
      errors.push(`${key} must be a number conforming to the specified constraints`);
    }
  }
  if (typeof body.status === 'string' && !(POWER_STATUSES as readonly string[]).includes(body.status)) {
    errors.push('status must be a valid enum value');
  }
  return errors;
}

function isDuplicate(contractNumber: unknown, exceptId?: string): boolean {
  if (typeof contractNumber !== 'string' || contractNumber.trim() === '') return false;
  const n = contractNumber.trim().toLowerCase();
  return powerMockDb
    .all()
    .some((r) => r.id !== exceptId && String(r.contractNumber ?? '').toLowerCase() === n);
}

const conflict = (): Reply => [
  409,
  { statusCode: 409, message: 'Contract number already exists', error: 'Conflict' },
];

/** Server-side status: DRAFT without an expiration date, else by days left vs notifyDaysBefore. */
function deriveStatus(rec: RawPowerContract): string {
  const exp = toPowerContract(rec).expirationDate;
  if (!exp) return 'DRAFT';
  const left = daysLeft(exp);
  if (left === null) return 'DRAFT';
  if (left < 0) return 'EXPIRED';
  const notify = Number(rec.notifyDaysBefore ?? 60);
  return left <= notify ? 'EXPIRING_SOON' : 'ACTIVE';
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function register(mock: MockAdapter): void {
  mock.onGet(endpoints.powerContracts.list).reply((config) => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const p = (config.params ?? {}) as Record<string, unknown>;
    const page = Math.max(1, Math.floor(num(p.page, 1)));
    const limit = Math.min(100, Math.max(1, Math.floor(num(p.limit, 10))));
    const search = typeof p.search === 'string' ? p.search.trim().toLowerCase() : '';
    const pt = typeof p.projectTypeOrCustomer === 'string' ? p.projectTypeOrCustomer.trim().toLowerCase() : '';

    const rows = powerMockDb.all().filter((r) => {
      if (p.contractType && r.contractType !== p.contractType) return false;
      if (p.status && r.status !== p.status) return false;
      if (pt && !String(r.projectTypeOrCustomer ?? '').toLowerCase().includes(pt)) return false;
      if (search) {
        const hay = [r.contractNumber, r.projectName, r.projectTypeOrCustomer]
          .map((x) => String(x ?? '').toLowerCase())
          .join('\n');
        if (!hay.includes(search)) return false;
      }
      return true;
    });
    const total = rows.length;
    return [
      200,
      {
        data: rows.slice((page - 1) * limit, page * limit),
        meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    ];
  });

  mock.onGet(endpoints.powerContracts.dashboard).reply(() => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const all = powerMockDb.all();
    const mapped = all.map(toPowerContract);
    const byStatus: Record<string, number> = {};
    for (const s of POWER_STATUSES) byStatus[s] = mapped.filter((c) => c.status === s).length;
    const mw = (c: (typeof mapped)[number]) =>
      c.capacityValue === null ? 0 : c.capacityUnit === 'kW' ? c.capacityValue / 1000 : c.capacityValue;
    const groups = new Map<string, { count: number; capacityMw: number }>();
    for (const c of mapped) {
      const g = groups.get(c.projectTypeOrCustomer) ?? { count: 0, capacityMw: 0 };
      g.count += 1;
      g.capacityMw += mw(c);
      groups.set(c.projectTypeOrCustomer, g);
    }
    const expiringSoon = all
      .filter((r) => r.status === 'EXPIRING_SOON')
      .sort((a, b) => String(a.expirationDate).localeCompare(String(b.expirationDate)))
      .slice(0, 10);
    return [
      200,
      {
        data: {
          total: all.length,
          byStatus,
          purchaseCount: mapped.filter((c) => c.contractType === 'PURCHASE').length,
          saleCount: mapped.filter((c) => c.contractType === 'SALE').length,
          totalCapacityMw: Math.round(mapped.reduce((s, c) => s + mw(c), 0) * 1000) / 1000,
          byProjectType: [...groups.entries()]
            .map(([projectType, g]) => ({
              projectType,
              count: g.count,
              capacityMw: Math.round(g.capacityMw * 1000) / 1000,
            })),
          expiringSoon,
        },
      },
    ];
  });

  mock.onGet(DETAIL_RE).reply((config) => {
    const auth = authorize('view');
    if ('reply' in auth) return auth.reply;
    const id = decodeURIComponent(config.url?.match(DETAIL_RE)?.[1] ?? '');
    const rec = powerMockDb.find(id);
    if (!rec) return [404, { statusCode: 404, message: 'Power contract not found', error: 'Not Found' }];
    return [200, { data: rec }];
  });

  mock.onPost(endpoints.powerContracts.list).reply((config) => {
    const auth = authorize('create');
    if ('reply' in auth) return auth.reply;
    const body = parseBody(config.data);
    const errors = validate(body, false);
    if (errors.length > 0) return badRequest(errors);
    if (isDuplicate(body.contractNumber)) return conflict();
    const rec: Omit<RawPowerContract, 'id'> = {
      notifyDaysBefore: 60,
      capacityUnit: 'MW',
      tariffCurrency: 'USD',
      ...body,
    };
    for (const key of DATE_FIELDS) if (typeof rec[key] === 'string' && rec[key] === '') rec[key] = null;
    const now = new Date().toISOString();
    rec.createdAt = now;
    rec.updatedAt = now;
    rec.status = deriveStatus(rec as RawPowerContract);
    return [201, { data: powerMockDb.insert(rec) }];
  });

  mock.onPatch(DETAIL_RE).reply((config) => {
    const auth = authorize('edit');
    if ('reply' in auth) return auth.reply;
    const id = decodeURIComponent(config.url?.match(DETAIL_RE)?.[1] ?? '');
    const rec = powerMockDb.find(id);
    if (!rec) return [404, { statusCode: 404, message: 'Power contract not found', error: 'Not Found' }];
    const body = parseBody(config.data);
    const errors = validate(body, true);
    if (errors.length > 0) return badRequest(errors);
    if ('contractNumber' in body && isDuplicate(body.contractNumber, id)) return conflict();
    Object.assign(rec, body, { updatedAt: new Date().toISOString() });
    if (!('status' in body) && ('expirationDate' in body || 'notifyDaysBefore' in body)) {
      if (rec.status !== 'TERMINATED') rec.status = deriveStatus(rec);
    }
    return [200, { data: rec }];
  });

  mock.onDelete(DETAIL_RE).reply((config) => {
    const auth = authorize('delete');
    if ('reply' in auth) return auth.reply;
    const id = decodeURIComponent(config.url?.match(DETAIL_RE)?.[1] ?? '');
    if (!powerMockDb.remove(id)) {
      return [404, { statusCode: 404, message: 'Power contract not found', error: 'Not Found' }];
    }
    return [200, { data: { success: true } }];
  });
}
