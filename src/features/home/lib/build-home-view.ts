import type { Contract, ContractsDashboard } from '@/features/gc';
import {
  isCaseFinished,
  type LegalCasesDashboard,
  type LegalDocumentsDashboard,
} from '@/features/legal';
import type { PowerContract, PowerContractsDashboard } from '@/features/ppa';
import { hasSystemModule } from '@/lib/auth/permissions';
import { lo } from '@/lib/i18n/lo';
import type { User } from '@/types/domain';
import type { ModuleCardVm, UpcomingItem } from '../types';

export interface HomeSources {
  gc: boolean;
  ppa: boolean;
  legalDocs: boolean;
  legalCases: boolean;
}

/** Which backend dashboards this user may read. */
export function selectHomeSources(u: User): HomeSources {
  return {
    gc: hasSystemModule(u, 'contracts'),
    ppa: hasSystemModule(u, 'power-contracts'),
    legalDocs: hasSystemModule(u, 'legal-documents'),
    legalCases: hasSystemModule(u, 'legal-cases'),
  };
}

export function buildGcCard(d: ContractsDashboard): ModuleCardVm {
  const active = d.byStatus.find((s) => s.status === 'ACTIVE')?.count ?? 0;
  return {
    module: 'gc',
    metrics: [
      { id: 'total', label: lo.home.stats.total, value: d.total },
      { id: 'active', label: lo.home.stats.active, value: active, tone: 'emerald' },
      { id: 'expiring', label: lo.home.stats.expiring, value: d.expiringSoonCount, tone: 'amber' },
    ],
  };
}

export function buildPpaCard(d: PowerContractsDashboard): ModuleCardVm {
  return {
    module: 'ppa',
    metrics: [
      { id: 'total', label: lo.home.stats.total, value: d.total },
      { id: 'capacity', label: lo.home.stats.capacity, value: d.totalCapacityMw },
      { id: 'expiring', label: lo.home.stats.expiring, value: d.expiringSoon.length, tone: 'amber' },
    ],
  };
}

export function buildLegalCard(d: {
  docs?: LegalDocumentsDashboard;
  cases?: LegalCasesDashboard;
}): ModuleCardVm {
  const metrics: ModuleCardVm['metrics'] = [];
  if (d.docs) {
    metrics.push(
      { id: 'docsTotal', label: lo.home.stats.docsTotal, value: d.docs.total },
      { id: 'docsActive', label: lo.home.stats.docsActive, value: d.docs.active, tone: 'emerald' },
    );
  }
  if (d.cases) {
    const open = d.cases.byDisputeStatus
      .filter((s) => !isCaseFinished(s.status))
      .reduce((n, s) => n + s.count, 0);
    metrics.push(
      { id: 'casesTotal', label: lo.home.stats.casesTotal, value: d.cases.total },
      { id: 'casesOpen', label: lo.home.stats.casesOpen, value: open, tone: 'amber' },
    );
  }
  return { module: 'legal', metrics };
}

/** Merges GC and PPA expiring contracts, soonest first; undated ones are dropped. */
export function buildUpcoming(gc: Contract[], ppa: PowerContract[]): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const c of gc) {
    if (!c.expirationDate) continue;
    items.push({
      key: `gc:${c.id}`,
      module: 'gc',
      title: c.title,
      number: c.contractNumber,
      expirationDate: c.expirationDate,
      href: `/contracts/${encodeURIComponent(c.id)}`,
    });
  }
  for (const c of ppa) {
    if (!c.expirationDate) continue;
    items.push({
      key: `ppa:${c.id}`,
      module: 'ppa',
      title: c.projectName,
      number: c.contractNumber,
      expirationDate: c.expirationDate,
      href: `/ppa/contracts/${encodeURIComponent(c.id)}`,
    });
  }
  return items.sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
}
