import type { Alert, ModuleKey } from '@/types/domain';

function localIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Due date `offset` days from today, as local-time YYYY-MM-DD (not UTC). */
function dueIn(offset: number): string {
  const now = new Date();
  return localIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset));
}

const SEED: Array<{ module: ModuleKey; entityType: string; title: string; offset: number; read: boolean }> = [
  { module: 'ppa', entityType: 'contract', title: 'PPA-NN2 Renewal', offset: -2, read: false },
  { module: 'ppa', entityType: 'contract', title: 'PPA-XPL Tariff Review', offset: 0, read: false },
  { module: 'ppa', entityType: 'contract', title: 'PPA-NT1 COD Milestone', offset: 3, read: true },
  { module: 'ppa', entityType: 'contract', title: 'PPA-HPP Expiry', offset: 12, read: false },
  { module: 'ppa', entityType: 'contract', title: 'PPA-TN Extension', offset: 45, read: false },
  { module: 'gc', entityType: 'contract', title: 'GC-0412 Service Agreement', offset: 7, read: false },
  { module: 'gc', entityType: 'contract', title: 'GC-0388 Lease Agreement', offset: 25, read: true },
  { module: 'gc', entityType: 'contract', title: 'GC-0351 Supply Contract', offset: 30, read: false },
  { module: 'gc', entityType: 'contract', title: 'GC-0299 Maintenance', offset: 80, read: false },
  { module: 'gc', entityType: 'contract', title: 'GC-0210 Consulting', offset: 120, read: true },
  { module: 'legal', entityType: 'case', title: 'Hearing: Case 24/2026', offset: 0, read: false },
  { module: 'legal', entityType: 'regulation', title: 'Regulation 118 Review', offset: 12, read: false },
  { module: 'legal', entityType: 'procurement', title: 'Procurement P-077 Deadline', offset: 25, read: true },
  { module: 'legal', entityType: 'case', title: 'Appeal Filing Case 11/2026', offset: 80, read: false },
];

/** Computed once at module load, relative to the day the app starts. */
export const MOCK_ALERTS: Alert[] = SEED.map((s, i) => ({
  id: `al-${i + 1}`,
  module: s.module,
  entityType: s.entityType,
  entityId: `${s.module}-${i + 1}`,
  title: s.title,
  dueDate: dueIn(s.offset),
  daysLeft: s.offset,
  read: s.read,
}));
