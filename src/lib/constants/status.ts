import { lo } from '@/lib/i18n/lo';
import type { ContractStatus } from '@/types/domain';

export type StatusTone = 'emerald' | 'blue' | 'violet' | 'amber' | 'rose' | 'slate';

type StatusMeta = { label: string; tone: StatusTone };

export const STATUS_META: Record<ContractStatus, StatusMeta> = {
  DRAFT: { label: lo.status.DRAFT, tone: 'slate' },
  ACTIVE: { label: lo.status.ACTIVE, tone: 'emerald' },
  EXPIRING_SOON: { label: lo.status.EXPIRING_SOON, tone: 'amber' },
  EXPIRED: { label: lo.status.EXPIRED, tone: 'rose' },
  TERMINATED: { label: lo.status.TERMINATED, tone: 'slate' },
};
