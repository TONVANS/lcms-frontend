import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { emptyUserForm } from '../schemas/user.schema';
import { DIVISIONS, type AdminUser } from '../types';
import {
  diffUserUpdate,
  hrmToFormPatch,
  impliesAllPermissions,
  permissionSummary,
  resolveFlags,
  toAdminUser,
  toCreatePayload,
  toHrmEmployee,
} from './user-mapper';

const base: AdminUser = {
  id: 'u1',
  employeeCode: 'E1',
  username: 'e1',
  fullName: 'A',
  email: null,
  phone: null,
  department: 'D',
  division: DIVISIONS[0],
  position: null,
  role: 'EDITOR',
  canView: true,
  canUpload: true,
  canEdit: false,
  canDelete: false,
  canDownload: false,
  isActive: true,
  createdAt: null,
};

const formOf = (o: Partial<ReturnType<typeof emptyUserForm>>) => ({ ...emptyUserForm(), ...o });

describe('DIVISIONS', () => {
  it('has the three exact backend strings', () => {
    expect([...DIVISIONS]).toEqual([
      'ພະແນກສັນຍາທົ່ວໄປ',
      'ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ',
      'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ',
    ]);
  });
});

describe('toAdminUser', () => {
  it('maps a backend user', () => {
    const u = toAdminUser({
      id: 7,
      employeeCode: ' EMP1 ',
      username: 'emp1',
      fullName: 'Name',
      email: '',
      role: 'main_user',
      canView: true,
      canUpload: 1,
      isActive: false,
      createdAt: '2026-01-02T03:04:05.000Z',
    });
    expect(u).toMatchObject({
      id: '7',
      employeeCode: 'EMP1',
      email: null,
      role: 'MAIN_USER',
      canView: true,
      canUpload: false,
      isActive: false,
      createdAt: '2026-01-02T03:04:05.000Z',
    });
  });
  it('is tolerant of garbage', () => {
    const u = toAdminUser(null);
    expect(u.role).toBe('VIEWER');
    expect(u.isActive).toBe(true);
    expect(u.fullName).toBe('');
    expect(u.canView).toBe(false);
  });
});

describe('toHrmEmployee', () => {
  it('maps and falls back to first+last name', () => {
    expect(
      toHrmEmployee({ employeeCode: 'E9', firstName: 'A', lastName: 'B', department: 'D', email: 'a@b.la' }, 'X'),
    ).toMatchObject({ employeeCode: 'E9', fullName: 'A B', department: 'D', email: 'a@b.la', phone: null });
  });
  it('uses the requested code when absent', () => {
    expect(toHrmEmployee({ fullName: 'Z' }, 'REQ').employeeCode).toBe('REQ');
  });
});

describe('hrmToFormPatch', () => {
  it('fills profile fields, keeping only known divisions', () => {
    const p = hrmToFormPatch({
      employeeCode: 'E1',
      fullName: 'N',
      department: 'D',
      division: DIVISIONS[2],
      position: null,
      email: 'a@b.la',
      phone: '020',
    });
    expect(p).toEqual({ fullName: 'N', department: 'D', division: DIVISIONS[2], email: 'a@b.la', phone: '020' });
    expect(
      hrmToFormPatch({ employeeCode: 'E1', fullName: null, department: null, division: 'unknown', position: null, email: null, phone: null }),
    ).toEqual({});
  });
});

describe('role -> flags', () => {
  it('ADMIN and MAIN_USER imply every permission', () => {
    expect(impliesAllPermissions('ADMIN')).toBe(true);
    expect(impliesAllPermissions('MAIN_USER')).toBe(true);
    expect(impliesAllPermissions('EDITOR')).toBe(false);
    const none = { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false };
    expect(resolveFlags('ADMIN', none)).toEqual({
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
    });
    expect(resolveFlags('VIEWER', none)).toEqual(none);
  });
});

describe('payloads', () => {
  it('create payload omits empty optional fields and forces implied flags', () => {
    const p = toCreatePayload(
      formOf({ employeeCode: ' EMP9 ', role: 'ADMIN', fullName: ' ', division: DIVISIONS[1], canView: false }),
    );
    expect(p).toEqual({
      employeeCode: 'EMP9',
      role: 'ADMIN',
      division: DIVISIONS[1],
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
    });
  });
  it('update diff sends only changed fields', () => {
    const same = formOf({
      employeeCode: 'E1',
      role: 'EDITOR',
      division: DIVISIONS[0],
      department: 'D',
      canView: true,
      canUpload: true,
      isActive: true,
    });
    expect(diffUserUpdate(same, base)).toEqual({});
    expect(diffUserUpdate({ ...same, division: DIVISIONS[2], canEdit: true, isActive: false }, base)).toEqual({
      division: DIVISIONS[2],
      canEdit: true,
      isActive: false,
    });
  });
});

describe('permissionSummary', () => {
  it('joins the granted permissions', () => {
    const P = lo.users.permissions;
    expect(permissionSummary(base)).toBe(`${P.canView} · ${P.canUpload}`);
  });
  it('shows all for implied roles and none when empty', () => {
    expect(permissionSummary({ ...base, role: 'ADMIN', canView: false })).toBe(lo.users.permissionAll);
    expect(permissionSummary({ ...base, canView: false, canUpload: false })).toBe(lo.users.permissionNone);
  });
});
