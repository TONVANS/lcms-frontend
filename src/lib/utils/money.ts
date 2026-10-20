import type { Money } from '@/types/domain';
import { formatNumber } from './number';

export function formatMoney(m: Money): string {
  return `${formatNumber(m.amount)} ${m.currency}`;
}
