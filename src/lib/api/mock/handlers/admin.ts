import type MockAdapter from 'axios-mock-adapter';
import {
  adminMockDb,
  IN_USE_CONTRACT_TYPE_IDS,
  IN_USE_DEPARTMENT_IDS,
  type MockContractTypeRow,
  type MockDepartmentRow,
} from '@/features/admin/mocks/admin.mock';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

type Reply = [number, unknown];
interface Config {
  params?: Record<string, unknown>;
  data?: unknown;
}

const err = (statusCode: number, message: string, error: string): Reply => [
  statusCode,
  { statusCode, message, error },
];
const UNAUTHORIZED = () => err(401, 'Unauthorized', 'Unauthorized');
const FORBIDDEN = () => err(403, 'Forbidden resource', 'Forbidden');
const NOT_FOUND = () => err(404, 'ບໍ່ພົບຂໍ້ມູນ', 'Not Found');

/** Null when the caller may proceed; otherwise the 401/403 reply. Dropdowns need only a session. */
function guard(adminOnly = true): Reply | null {
  const user = getMockSessionUser();
  if (!user) return UNAUTHORIZED();
  if (adminOnly && user.role !== 'ADMIN') return FORBIDDEN();
  return null;
}

function body(config: Config): Record<string, unknown> {
  const d = config.data;
  if (typeof d === 'string') {
    try {
      const parsed: unknown = JSON.parse(d);
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof d === 'object' && d !== null ? (d as Record<string, unknown>) : {};
}

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

function activeFilter(params: Record<string, unknown> | undefined): boolean | undefined {
  const v = params?.isActive;
  if (v === undefined || v === '') return undefined;
  return v === true || v === 'true';
}

function idOf(url: string | undefined, base: string): string {
  const m = new RegExp(`^${base}/([^/?]+)`).exec(url ?? '');
  return m ? decodeURIComponent(m[1]) : '';
}

const TYPE_ID_RE = /^\/contract-types\/(?!dropdown(?:$|\?))[^/?]+$/;
const DEPT_ID_RE = /^\/departments\/(?!dropdown(?:$|\?)|hrm(?:$|\?)|sync(?:$|\?))[^/?]+$/;

const MSG = {
  typeDup: 'ຊື່ປະເພດສັນຍານີ້ມີຢູ່ແລ້ວ',
  typeInUse: 'ບໍ່ສາມາດລຶບໄດ້ ເນື່ອງຈາກປະເພດສັນຍານີ້ຖືກນຳໃຊ້ໃນສັນຍາ',
  deptDup: 'ຊື່ ຫຼື ລະຫັດພະແນກນີ້ມີຢູ່ແລ້ວ',
  deptInUse: 'ບໍ່ສາມາດລຶບໄດ້ ເນື່ອງຈາກພະແນກນີ້ຖືກນຳໃຊ້ຢູ່',
  required: ['nameLo should not be empty'],
};

export function register(mock: MockAdapter): void {
  // ---- Dropdowns: replace the static lookups handler so admin edits show up (same matcher replaces). ----
  mock.onGet(endpoints.departments.dropdown).reply((): Reply => {
    const denied = guard(false);
    if (denied) return denied;
    return [
      200,
      { data: adminMockDb.departments().filter((d) => d.isActive).map(({ id, name, code }) => ({ id, name, code })) },
    ];
  });
  mock.onGet(endpoints.contractTypes.dropdown).reply((): Reply => {
    const denied = guard(false);
    if (denied) return denied;
    return [
      200,
      {
        data: adminMockDb
          .contractTypes()
          .filter((t) => t.isActive)
          .map(({ id, nameLo, nameEn }) => ({ id, nameLo, nameEn })),
      },
    ];
  });

  // ---- Audit logs ----
  mock.onGet(endpoints.auditLogs.list).reply((config: Config): Reply => {
    const denied = guard();
    if (denied) return denied;
    const page = Math.max(1, Number(config.params?.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(config.params?.limit ?? 20) || 20));
    const action = text(config.params?.action);
    const userId = text(config.params?.userId);
    const contractId = text(config.params?.contractId);
    const rows = adminMockDb
      .auditLogs()
      .filter((r) => (!action || r.action === action) && (!userId || r.userId === userId))
      .filter((r) => !contractId || r.entityId === contractId);
    const total = rows.length;
    return [
      200,
      {
        data: rows.slice((page - 1) * limit, page * limit),
        meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    ];
  });

  // ---- Contract types ----
  mock.onGet(endpoints.contractTypes.list).reply((config: Config): Reply => {
    const denied = guard();
    if (denied) return denied;
    const q = text(config.params?.search).toLowerCase();
    const active = activeFilter(config.params);
    const rows = adminMockDb
      .contractTypes()
      .filter((t) => active === undefined || t.isActive === active)
      .filter((t) => !q || t.nameLo.toLowerCase().includes(q) || (t.nameEn ?? '').toLowerCase().includes(q));
    return [200, { data: rows }];
  });

  mock.onPost(endpoints.contractTypes.list).reply((config: Config): Reply => {
    const denied = guard();
    if (denied) return denied;
    const b = body(config);
    const nameLo = text(b.nameLo);
    if (!nameLo) return err(400, MSG.required[0], 'Bad Request');
    if (adminMockDb.contractTypes().some((t) => t.nameLo === nameLo)) return err(409, MSG.typeDup, 'Conflict');
    const row: MockContractTypeRow = {
      id: adminMockDb.newTypeId(),
      nameLo,
      nameEn: text(b.nameEn) || null,
      isActive: b.isActive !== false,
    };
    adminMockDb.setContractTypes([...adminMockDb.contractTypes(), row]);
    return [201, { data: row }];
  });

  mock.onGet(TYPE_ID_RE).reply((config: Config & { url?: string }): Reply => {
    const denied = guard();
    if (denied) return denied;
    const id = Number(idOf(config.url, '/contract-types'));
    const row = adminMockDb.contractTypes().find((t) => t.id === id);
    return row ? [200, { data: row }] : NOT_FOUND();
  });

  mock.onPatch(TYPE_ID_RE).reply((config: Config & { url?: string }): Reply => {
    const denied = guard();
    if (denied) return denied;
    const id = Number(idOf(config.url, '/contract-types'));
    const row = adminMockDb.contractTypes().find((t) => t.id === id);
    if (!row) return NOT_FOUND();
    const b = body(config);
    const nameLo = b.nameLo === undefined ? row.nameLo : text(b.nameLo);
    if (!nameLo) return err(400, MSG.required[0], 'Bad Request');
    if (adminMockDb.contractTypes().some((t) => t.id !== id && t.nameLo === nameLo)) {
      return err(409, MSG.typeDup, 'Conflict');
    }
    const next: MockContractTypeRow = {
      ...row,
      nameLo,
      nameEn: b.nameEn === undefined ? row.nameEn : text(b.nameEn) || null,
      isActive: b.isActive === undefined ? row.isActive : b.isActive !== false,
    };
    adminMockDb.setContractTypes(adminMockDb.contractTypes().map((t) => (t.id === id ? next : t)));
    return [200, { data: next }];
  });

  mock.onDelete(TYPE_ID_RE).reply((config: Config & { url?: string }): Reply => {
    const denied = guard();
    if (denied) return denied;
    const id = Number(idOf(config.url, '/contract-types'));
    if (!adminMockDb.contractTypes().some((t) => t.id === id)) return NOT_FOUND();
    if (IN_USE_CONTRACT_TYPE_IDS.has(id)) return err(400, MSG.typeInUse, 'Bad Request');
    adminMockDb.setContractTypes(adminMockDb.contractTypes().filter((t) => t.id !== id));
    return [200, { data: { id } }];
  });

  // ---- Departments ----
  mock.onGet(endpoints.departments.list).reply((config: Config): Reply => {
    const denied = guard();
    if (denied) return denied;
    const q = text(config.params?.search).toLowerCase();
    const active = activeFilter(config.params);
    const rows = adminMockDb
      .departments()
      .filter((d) => active === undefined || d.isActive === active)
      .filter((d) => !q || d.name.toLowerCase().includes(q) || (d.code ?? '').toLowerCase().includes(q));
    return [200, { data: rows }];
  });

  mock.onPost(endpoints.departments.list).reply((config: Config): Reply => {
    const denied = guard();
    if (denied) return denied;
    const b = body(config);
    const name = text(b.name);
    const code = text(b.code) || null;
    if (!name) return err(400, 'name should not be empty', 'Bad Request');
    if (adminMockDb.departments().some((d) => d.name === name || (code && d.code === code))) {
      return err(409, MSG.deptDup, 'Conflict');
    }
    const row: MockDepartmentRow = { id: adminMockDb.newDeptId(), name, code, isActive: b.isActive !== false };
    adminMockDb.setDepartments([...adminMockDb.departments(), row]);
    return [201, { data: row }];
  });

  mock.onPost(endpoints.departments.sync).reply((): Reply => {
    const denied = guard();
    if (denied) return denied;
    const hrm = [
      { name: 'ຫ້ອງການ ຝ່າຍຄົ້ນຄວ້າ ແລະ ພັດທະນາ', code: 'RND' },
      { name: 'ຫ້ອງການ ຝ່າຍຄວາມປອດໄພ', code: 'SAF' },
    ];
    let created = 0;
    for (const h of hrm) {
      if (adminMockDb.departments().some((d) => d.code === h.code)) continue;
      adminMockDb.setDepartments([
        ...adminMockDb.departments(),
        { id: adminMockDb.newDeptId(), name: h.name, code: h.code, isActive: true },
      ]);
      created += 1;
    }
    return [201, { data: { created, updated: 3, total: adminMockDb.departments().length } }];
  });

  mock.onGet(DEPT_ID_RE).reply((config: Config & { url?: string }): Reply => {
    const denied = guard();
    if (denied) return denied;
    const row = adminMockDb.departments().find((d) => d.id === idOf(config.url, '/departments'));
    return row ? [200, { data: row }] : NOT_FOUND();
  });

  mock.onPatch(DEPT_ID_RE).reply((config: Config & { url?: string }): Reply => {
    const denied = guard();
    if (denied) return denied;
    const id = idOf(config.url, '/departments');
    const row = adminMockDb.departments().find((d) => d.id === id);
    if (!row) return NOT_FOUND();
    const b = body(config);
    const name = b.name === undefined ? row.name : text(b.name);
    const code = b.code === undefined ? row.code : text(b.code) || null;
    if (!name) return err(400, 'name should not be empty', 'Bad Request');
    if (adminMockDb.departments().some((d) => d.id !== id && (d.name === name || (code && d.code === code)))) {
      return err(409, MSG.deptDup, 'Conflict');
    }
    const next: MockDepartmentRow = {
      ...row,
      name,
      code,
      isActive: b.isActive === undefined ? row.isActive : b.isActive !== false,
    };
    adminMockDb.setDepartments(adminMockDb.departments().map((d) => (d.id === id ? next : d)));
    return [200, { data: next }];
  });

  mock.onDelete(DEPT_ID_RE).reply((config: Config & { url?: string }): Reply => {
    const denied = guard();
    if (denied) return denied;
    const id = idOf(config.url, '/departments');
    if (!adminMockDb.departments().some((d) => d.id === id)) return NOT_FOUND();
    if (IN_USE_DEPARTMENT_IDS.has(id)) return err(400, MSG.deptInUse, 'Bad Request');
    adminMockDb.setDepartments(adminMockDb.departments().filter((d) => d.id !== id));
    return [200, { data: { id } }];
  });
}
