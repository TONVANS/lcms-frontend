import { describe, expect, it } from 'vitest';
import { daysLeft } from '@/lib/utils/date';
import type { Alert, ModuleKey, User } from '@/types/domain';
import type { HomeSummary } from '../types';
import { buildHomeView } from './build-home-view';

const today = new Date(2026, 9, 20);

function alertAt(id: string, module: ModuleKey, offset: number): Alert {
  const d = new Date(2026, 9, 20 + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    id,
    module,
    entityType: 'contract',
    entityId: `e-${id}`,
    title: `t-${id}`,
    dueDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    daysLeft: offset,
    read: false,
  };
}

const user = (modules: ModuleKey[], role: User['role'] = 'user'): User => ({
  id: 'u',
  fullName: 'x',
  username: 'x',
  email: 'x@x',
  role,
  departmentId: 'd',
  departmentName: 'd',
  modules,
});

const summary: HomeSummary = {
  modules: [
    { module: 'ppa', total: 10, active: 8, expiring: 2 },
    { module: 'gc', total: 5, active: 4, expiring: 1 },
    { module: 'legal', total: 7, active: 6, expiring: 1 },
  ],
  alerts: [
    alertAt('a1', 'legal', 3),
    alertAt('a2', 'ppa', 31),
    alertAt('a3', 'gc', 20),
    alertAt('a4', 'ppa', -2),
    alertAt('a5', 'ppa', 0),
    alertAt('a6', 'gc', 30),
    alertAt('a7', 'ppa', 5),
    alertAt('a8', 'gc', 60),
  ],
};

describe('buildHomeView', () => {
  it('keeps accessible modules, sorts upcoming ascending, recomputes buckets', () => {
    const r = buildHomeView(summary, user(['ppa', 'gc']), today);
    expect(r.modules.map((m) => m.module)).toEqual(['ppa', 'gc']);
    expect(r.upcoming.every((a) => a.module !== 'legal')).toBe(true);
    expect(r.upcoming.map((a) => daysLeft(a.dueDate, today))).toEqual([0, 5, 20, 30]);
    expect(r.alertBuckets).toEqual({ within7: 2, within30: 2, within90: 2 });
  });

  it('returns nothing for a user without modules', () => {
    const r = buildHomeView(summary, user([]), today);
    expect(r.modules).toEqual([]);
    expect(r.upcoming).toEqual([]);
    expect(r.alertBuckets).toEqual({ within7: 0, within30: 0, within90: 0 });
  });

  it('gives admin every module', () => {
    const r = buildHomeView(summary, user([], 'admin'), today);
    expect(r.modules.map((m) => m.module)).toEqual(['ppa', 'gc', 'legal']);
  });
});
