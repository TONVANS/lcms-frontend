import { lo } from '@/lib/i18n/lo';
import type { ContractStatus, LegacyContractStatus } from '@/types/domain';

export type StatusTone = 'emerald' | 'blue' | 'violet' | 'amber' | 'rose' | 'slate';

type StatusMeta = { label: string; tone: StatusTone };

export const STATUS_META: Record<ContractStatus, StatusMeta> = {
  DRAFT: { label: lo.status.DRAFT, tone: 'slate' },
  ACTIVE: { label: lo.status.ACTIVE, tone: 'emerald' },
  EXPIRING_SOON: { label: lo.status.EXPIRING_SOON, tone: 'amber' },
  EXPIRED: { label: lo.status.EXPIRED, tone: 'rose' },
  TERMINATED: { label: lo.status.TERMINATED, tone: 'slate' },
};

/** Pre-backend statuses still used by GC/PPA; removed when Tasks 6/9 migrate them. */
export const LEGACY_STATUS_META: Record<LegacyContractStatus, StatusMeta> = {
  active: { label: lo.status.active, tone: 'emerald' },
  negotiating: { label: lo.status.negotiating, tone: 'blue' },
  pending_cod: { label: lo.status.pending_cod, tone: 'violet' },
  expiring: { label: lo.status.expiring, tone: 'amber' },
  expired: { label: lo.status.expired, tone: 'rose' },
  draft: { label: lo.status.draft, tone: 'slate' },
  terminated: { label: lo.status.terminated, tone: 'slate' },
};
