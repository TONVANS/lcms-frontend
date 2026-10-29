import { formatNumber } from '@/lib/utils/number';
import type { CapacityUnit, Currency } from '../types';

export const EMPTY = '—';

/** "1,088 MW"; the tariff keeps up to 4 decimals (0.0585 USD/kWh). */
export function formatCapacity(value: number | null, unit: CapacityUnit | null): string {
  return value === null ? EMPTY : `${formatNumber(value)} ${unit ?? 'MW'}`;
}

export function formatTariff(value: number | null, currency: Currency | null): string {
  return value === null ? EMPTY : `${formatNumber(value, 4)} ${currency ?? ''}/kWh`.replace('  ', ' ');
}

export const displayText = (v: string | null | undefined): string => (v && v.trim() ? v : EMPTY);
