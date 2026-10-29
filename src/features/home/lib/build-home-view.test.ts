import { describe, expect, it } from 'vitest';
import type { Contract, ContractsDashboard } from '@/features/gc';
import type { LegalCasesDashboard, LegalDocumentsDashboard } from '@/features/legal';
import type { PowerContract, PowerContractsDashboard } from '@/features/ppa';
import type { SystemModule, User } from '@/types/domain';
import {
  buildGcCard,
  buildLegalCard,
  buildPpaCard,
  buildUpcoming,
  selectHomeSources,
} from './build-home-view';

const gcDash = {
  total: 12,
  expiringSoonCount: 3,
  expiredCount: 1,
  byStatus: [
    { status: 'ACTIVE', count: 7 },
    { status: 'EXPIRING_SOON', count: 3 },
  ],
  byCurrency: [],
  valueByCurrency: [],
  byContractType: [],
} as ContractsDashboard;

const ppaDash = {
  total: 9,
  byStatus: [],
  purchaseCount: 4,
  saleCount: 5,
  totalCapacityMw: 1234.5,
  byProjectType: [],
  expiringSoon: [],
} as unknown as PowerContractsDashboard;

const docs = {
  total: 20,
  active: 15,
  inactive: 5,
  byType: [],
  byDepartment: [],
} as LegalDocumentsDashboard;
const cases = {
  total: 8,
  byDisputeStatus: [
    { status: 'FIRST_INSTANCE', count: 3 },
    { status: 'APPEAL', count: 2 },
    { status: 'CLOSED', count: 2 },
    { status: 'RESOLVED', count: 1 },
  ],
} as unknown as LegalCasesDashboard;

const value = (c: { metrics: { id: string; value: number }[] }, id: string) =>
  c.metrics.find((m) => m.id === id)?.value;

describe('module cards', () => {
  it('gc: total / ACTIVE count / expiring soon', () => {
    const c = buildGcCard(gcDash);
    expect(c.module).toBe('gc');
    expect([value(c, 'total'), value(c, 'active'), value(c, 'expiring')]).toEqual([12, 7, 3]);
  });

  it('gc: missing ACTIVE bucket counts as 0', () => {
    expect(value(buildGcCard({ ...gcDash, byStatus: [] }), 'active')).toBe(0);
  });

  it('ppa: total / MW / expiring soon (length of expiringSoon)', () => {
    const c = buildPpaCard({ ...ppaDash, expiringSoon: [{ id: '1' } as PowerContract] });
    expect([value(c, 'total'), value(c, 'capacity'), value(c, 'expiring')]).toEqual([9, 1234.5, 1]);
  });

  it('legal: documents and open cases (not CLOSED/RESOLVED)', () => {
    const c = buildLegalCard({ docs, cases });
    expect(c.module).toBe('legal');
    expect(
      ['docsTotal', 'docsActive', 'casesTotal', 'casesOpen'].map((id) => value(c, id)),
    ).toEqual([20, 15, 8, 5]);
  });

  it('legal: only the dashboards the user can see', () => {
    expect(buildLegalCard({ docs }).metrics.map((m) => m.id)).toEqual(['docsTotal', 'docsActive']);
    expect(buildLegalCard({ cases }).metrics.map((m) => m.id)).toEqual(['casesTotal', 'casesOpen']);
  });
});

const gcC = (id: string, exp: string | null): Contract =>
  ({ id, title: `gc-${id}`, contractNumber: `N-${id}`, expirationDate: exp }) as Contract;
const ppaC = (id: string, exp: string | null): PowerContract =>
  ({ id, projectName: `ppa-${id}`, contractNumber: `P-${id}`, expirationDate: exp }) as PowerContract;

describe('buildUpcoming', () => {
  it('merges, sorts by expirationDate, drops undated, builds links', () => {
    const r = buildUpcoming(
      [gcC('a', '2026-12-01'), gcC('b', null)],
      [ppaC('c', '2026-11-05'), ppaC('d', '2027-01-01')],
    );
    expect(r.map((i) => i.title)).toEqual(['ppa-c', 'gc-a', 'ppa-d']);
    expect(r.map((i) => i.href)).toEqual(['/ppa/contracts/c', '/contracts/a', '/ppa/contracts/d']);
    expect(new Set(r.map((i) => i.key)).size).toBe(3);
  });
});

const user = (role: User['role'], modules: SystemModule[]): User =>
  ({ role, accessibleModules: modules }) as User;

describe('selectHomeSources', () => {
  it('admin gets everything', () => {
    expect(selectHomeSources(user('ADMIN', []))).toEqual({
      gc: true,
      ppa: true,
      legalDocs: true,
      legalCases: true,
    });
  });
  it('legal-cases only user', () => {
    expect(selectHomeSources(user('VIEWER', ['legal-cases']))).toEqual({
      gc: false,
      ppa: false,
      legalDocs: false,
      legalCases: true,
    });
  });
  it('no business module', () => {
    expect(Object.values(selectHomeSources(user('VIEWER', ['support'])))).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });
});
