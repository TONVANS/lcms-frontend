import type MockAdapter from 'axios-mock-adapter';
import { usersMockDb, type MockUserRow } from '@/features/users/mocks/users.mock';
import { isAdmin } from '@/lib/auth/permissions';
import { getMockSessionUser } from '../session';

const nest = (statusCode: number, message: string | string[], error: string) => ({
  statusCode,
  message,
  error,
});

type Reply = [number, unknown];

function adminGuard(): { error: Reply } | { me: NonNullable<ReturnType<typeof getMockSessionUser>> } {
  const me = getMockSessionUser();
  if (!me) return { error: [401, nest(401, 'Unauthorized', 'Unauthorized')] };
  if (!isAdmin(me)) return { error: [403, nest(403, 'Forbidden resource', 'Forbidden')] };
  return { me };
}

const ROLES = ['ADMIN', 'MAIN_USER', 'EDITOR', 'VIEWER'];
const FLAGS = ['canView', 'canUpload', 'canEdit', 'canDelete', 'canDownload'] as const;
const EDITABLE = ['role', 'isActive', 'division', 'department', ...FLAGS] as const;

const notFound = (): Reply => [404, nest(404, 'ບໍ່ພົບຜູ້ໃຊ້', 'Not Found')];
const idOf = (url: string | undefined, re: RegExp): string => decodeURIComponent(re.exec(url ?? '')?.[1] ?? '');
const parse = (data: unknown): Record<string, unknown> => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (data ?? {}) as Record<string, unknown>;
};

const HRM_RE = /^\/users\/hrm\/([^/?]+)$/;
const ITEM_RE = /^\/users\/([^/?]+)$/;

export function register(mock: MockAdapter): void {
  mock.onGet('/users').reply((config) => {
    const g = adminGuard();
    if ('error' in g) return g.error;
    const p = (config.params ?? {}) as Record<string, unknown>;
    const page = Math.max(1, Number(p.page) || 1);
    const limit = Math.max(1, Number(p.limit) || 10);
    const search = typeof p.search === 'string' ? p.search.trim().toLowerCase() : '';
    let list = usersMockDb.all();
    if (search) {
      list = list.filter((u) =>
        [u.fullName, u.employeeCode, u.username, u.email ?? ''].some((s) => String(s).toLowerCase().includes(search)),
      );
    }
    if (typeof p.role === 'string' && p.role) list = list.filter((u) => u.role === p.role);
    if (p.isActive !== undefined && p.isActive !== '') {
      const want = p.isActive === true || p.isActive === 'true';
      list = list.filter((u) => u.isActive === want);
    }
    const total = list.length;
    const data = list.slice((page - 1) * limit, page * limit);
    return [200, { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } }];
  });

  mock.onGet(HRM_RE).reply((config) => {
    const g = adminGuard();
    if ('error' in g) return g.error;
    const profile = usersMockDb.hrm(idOf(config.url, HRM_RE));
    if (!profile) return [404, nest(404, 'ບໍ່ພົບພະນັກງານໃນ HRM', 'Not Found')];
    return [200, { data: profile }];
  });

  mock.onPost('/users').reply((config) => {
    const g = adminGuard();
    if ('error' in g) return g.error;
    const dto = parse(config.data);
    const code = typeof dto.employeeCode === 'string' ? dto.employeeCode.trim() : '';
    if (!code) return [400, nest(400, ['employeeCode should not be empty'], 'Bad Request')];
    if (usersMockDb.findByCode(code)) {
      return [409, nest(409, 'ພະນັກງານລະຫັດນີ້ມີໃນລະບົບແລ້ວ', 'Conflict')];
    }
    const role = typeof dto.role === 'string' ? dto.role : 'VIEWER';
    if (!ROLES.includes(role)) return [400, nest(400, ['role must be a valid enum value'], 'Bad Request')];
    const hrm = usersMockDb.hrm(code);
    const pick = (k: 'fullName' | 'department' | 'division' | 'email' | 'phone'): string | null => {
      const fromHrm = hrm?.[k];
      if (fromHrm) return fromHrm;
      const v = dto[k];
      return typeof v === 'string' && v.trim() ? v.trim() : null;
    };
    const fullName = pick('fullName');
    if (!fullName) return [400, nest(400, ['fullName should not be empty'], 'Bad Request')];
    const implied = role === 'ADMIN' || role === 'MAIN_USER';
    const row: Omit<MockUserRow, 'id' | 'createdAt'> = {
      employeeCode: code,
      username: code,
      fullName,
      email: pick('email'),
      phone: pick('phone'),
      department: pick('department'),
      division: pick('division'),
      position: hrm?.position ?? null,
      role,
      canView: implied || dto.canView !== false,
      canUpload: implied || dto.canUpload === true,
      canEdit: implied || dto.canEdit === true,
      canDelete: implied || dto.canDelete === true,
      canDownload: implied || dto.canDownload === true,
      accessibleModules: ['departments', 'support'],
      isActive: true,
    };
    return [201, { data: usersMockDb.insert(row) }];
  });

  mock.onGet(ITEM_RE).reply((config) => {
    const g = adminGuard();
    if ('error' in g) return g.error;
    const row = usersMockDb.find(idOf(config.url, ITEM_RE));
    return row ? [200, { data: row }] : notFound();
  });

  mock.onPatch(ITEM_RE).reply((config) => {
    const g = adminGuard();
    if ('error' in g) return g.error;
    const row = usersMockDb.find(idOf(config.url, ITEM_RE));
    if (!row) return notFound();
    const dto = parse(config.data);
    if (dto.role !== undefined && !ROLES.includes(String(dto.role))) {
      return [400, nest(400, ['role must be a valid enum value'], 'Bad Request')];
    }
    for (const k of EDITABLE) if (dto[k] !== undefined) (row as Record<string, unknown>)[k] = dto[k];
    return [200, { data: row }];
  });

  mock.onDelete(ITEM_RE).reply((config) => {
    const g = adminGuard();
    if ('error' in g) return g.error;
    const id = idOf(config.url, ITEM_RE);
    if (id === g.me.id) return [400, nest(400, 'ບໍ່ສາມາດລຶບບັນຊີຂອງຕົນເອງໄດ້', 'Bad Request')];
    return usersMockDb.remove(id) ? [200, { data: { id } }] : notFound();
  });
}
