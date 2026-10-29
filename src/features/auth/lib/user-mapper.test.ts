import { describe, expect, it } from 'vitest';
import { toUser } from './user-mapper';

describe('toUser', () => {
  it('maps a full backend profile', () => {
    const u = toUser({
      id: 12,
      employeeCode: 'EMP01',
      username: 'gc.user',
      fullName: 'Somchai',
      email: 'a@b.la',
      phone: '020',
      department: 'D',
      division: 'V',
      position: 'P',
      role: 'MAIN_USER',
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
      accessibleModules: ['contracts', 'support'],
    });
    expect(u).toEqual({
      id: '12',
      employeeCode: 'EMP01',
      username: 'gc.user',
      fullName: 'Somchai',
      email: 'a@b.la',
      phone: '020',
      department: 'D',
      division: 'V',
      position: 'P',
      role: 'MAIN_USER',
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
      accessibleModules: ['contracts', 'support'],
    });
  });

  it('is tolerant: defaults booleans to false, nulls blanks, upper-cases role', () => {
    const u = toUser({ id: 'x', username: 'u', fullName: 'F', role: 'editor', email: '  ' });
    expect(u.role).toBe('EDITOR');
    expect(u.email).toBeNull();
    expect(u.employeeCode).toBeNull();
    expect(u.canView).toBe(false);
    expect(u.canDownload).toBe(false);
    expect(u.accessibleModules).toEqual([]);
  });

  it('unknown role becomes VIEWER', () => {
    expect(toUser({ id: '1', username: 'u', fullName: 'F', role: 'SUPERMAN' }).role).toBe('VIEWER');
    expect(toUser({ id: '1', username: 'u', fullName: 'F' }).role).toBe('VIEWER');
  });

  it('filters unknown modules and non-arrays', () => {
    const u = toUser({
      id: '1',
      username: 'u',
      fullName: 'F',
      accessibleModules: ['contracts', 'nope', 3, 'audit-logs'],
    });
    expect(u.accessibleModules).toEqual(['contracts', 'audit-logs']);
    expect(toUser({ id: '1', username: 'u', fullName: 'F', accessibleModules: 'contracts' }).accessibleModules).toEqual([]);
  });

  it('handles garbage input without throwing', () => {
    expect(toUser(null).role).toBe('VIEWER');
    expect(toUser(undefined).accessibleModules).toEqual([]);
    expect(toUser('x').username).toBe('');
  });
});
