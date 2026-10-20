import { lo } from '@/lib/i18n/lo';
import type { ContractStatus } from '@/types/domain';

export type StatusTone = 'emerald' | 'blue' | 'violet' | 'amber' | 'rose' | 'slate';

export const STATUS_META: Record<ContractStatus, { label: string; tone: StatusTone }> = {
  active: { label: lo.status.active, tone: 'emerald' },
  negotiating: { label: lo.status.negotiating, tone: 'blue' },
  pending_cod: { label: lo.status.pending_cod, tone: 'violet' },
  expiring: { label: lo.status.expiring, tone: 'amber' },
  expired: { label: lo.status.expired, tone: 'rose' },
  draft: { label: lo.status.draft, tone: 'slate' },
  terminated: { label: lo.status.terminated, tone: 'slate' },
};
