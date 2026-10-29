/** Raw (backend-shaped) mock notifications; dates are relative to today. */

function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function ago(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

interface Seed {
  n: number;
  gcId: string;
  label: string;
  daysLeft: number;
  read: boolean;
  created: number;
}

const GC_SEEDS: Seed[] = [
  { n: 1, gcId: 'gc-001', label: 'GC-2026-001', daysLeft: 5, read: false, created: 0 },
  { n: 2, gcId: 'gc-002', label: 'GC-2026-002', daysLeft: 12, read: false, created: 1 },
  { n: 3, gcId: 'gc-003', label: 'GC-2026-003', daysLeft: 28, read: false, created: 2 },
  { n: 4, gcId: 'gc-004', label: 'GC-2026-004', daysLeft: 45, read: true, created: 3 },
  { n: 5, gcId: 'gc-005', label: 'GC-2026-005', daysLeft: 60, read: true, created: 4 },
  { n: 6, gcId: 'gc-006', label: 'GC-2026-006', daysLeft: 60, read: false, created: 5 },
  { n: 7, gcId: 'gc-007', label: 'GC-2026-007', daysLeft: 30, read: true, created: 6 },
  { n: 8, gcId: 'gc-008', label: 'GC-2026-008', daysLeft: 7, read: true, created: 7 },
];

const PPA_SEEDS: Seed[] = [
  { n: 1, gcId: 'ppa-1', label: 'PPA-EDL-2010-001', daysLeft: 6, read: false, created: 0 },
  { n: 2, gcId: 'ppa-2', label: 'PPA-EDL-1971-002', daysLeft: 20, read: false, created: 2 },
  { n: 3, gcId: 'ppa-3', label: 'PPA-EDL-2015-014', daysLeft: 40, read: true, created: 3 },
  { n: 4, gcId: 'ppa-4', label: 'PPA-EDL-2023-088', daysLeft: 60, read: false, created: 4 },
  { n: 5, gcId: 'ppa-1', label: 'PPA-EDL-2010-001', daysLeft: 60, read: true, created: 8 },
  { n: 6, gcId: 'ppa-2', label: 'PPA-EDL-1971-002', daysLeft: 30, read: true, created: 9 },
];

export function createContractNotificationSeed(): Record<string, unknown>[] {
  return GC_SEEDS.map((s) => ({
    id: `n-${s.n}`,
    title: `Contract ${s.label} expires in ${s.daysLeft} days`,
    message: `Contract ${s.label} is approaching its expiration date.`,
    contractId: s.gcId,
    contract: { id: s.gcId, contractNumber: s.label, expirationDate: dayOffset(s.daysLeft) },
    daysLeft: s.daysLeft,
    isRead: s.read,
    createdAt: ago(s.created),
  }));
}

export function createPowerNotificationSeed(): Record<string, unknown>[] {
  return PPA_SEEDS.map((s) => ({
    id: `pn-${s.n}`,
    title: `Power contract ${s.label} expires in ${s.daysLeft} days`,
    message: `Power contract ${s.label} is approaching its expiration date.`,
    powerContractId: s.gcId,
    powerContract: { id: s.gcId, contractNumber: s.label, expirationDate: dayOffset(s.daysLeft) },
    daysRemaining: String(s.daysLeft),
    isRead: s.read,
    createdAt: ago(s.created),
  }));
}
