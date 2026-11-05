import { formatNumber } from '@/lib/utils/number';
import type { CapacityUnit, Currency } from '../types';

export const EMPTY = '—';

/** "1,088 MW"; the tariff keeps up to 4 decimals (0.0585 USD/kWh). */
export function formatCapacity(value: number | null, unit: CapacityUnit | null): string {
  return value === null || !Number.isFinite(value) ? EMPTY : `${formatNumber(value)} ${unit ?? 'MW'}`;
}

export function formatTariff(value: number | null, currency: Currency | null): string {
  return value === null || !Number.isFinite(value)
    ? EMPTY
    : `${formatNumber(value, 4)} ${currency ?? ''}/kWh`.replace('  ', ' ');
}

/** Composed preview string for installed capacity (e.g. "50 MW"). */
export function composeInstalledCapacity(value: number | null, unit: CapacityUnit | null): string {
  if (value === null || !Number.isFinite(value)) return '';
  return `${formatNumber(value, 2)} ${unit ?? 'MW'}`;
}

/** Composed preview string for tariff (e.g. "0.065 USD/kWh" or "850 LAK/kWh"). */
export function composeTariff(value: number | null, currency: Currency | null): string {
  if (value === null || !Number.isFinite(value)) return '';
  return `${formatNumber(value, 6)} ${currency ?? 'USD'}/kWh`;
}

/**
 * Converts months into Lao duration text (e.g. 300 -> "25 ປີ", 120 -> "10 ປີ", 18 -> "1 ປີ 6 ເດືອນ").
 */
export function monthsToDurationText(months: number | null | undefined): string {
  if (months === null || months === undefined || !Number.isFinite(months) || months <= 0) return '';
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years > 0 && rem > 0) return `${years} ປີ ${rem} ເດືອນ`;
  if (years > 0) return `${years} ປີ`;
  return `${rem} ເດືອນ`;
}

/**
 * Parses Lao duration text (e.g. "25 ປີ" -> 300, "10 ປີ" -> 120, "18 ເດືອນ" -> 18) into months.
 */
export function durationTextToMonths(text: string | null | undefined): number | null {
  if (!text) return null;
  const t = text.trim();
  if (!t) return null;
  // Match "X ປີ Y ເດືອນ" or "X ປີ"
  const ym = t.match(/^(\d+)\s*ປີ(?:\s*(\d+)\s*ເດືອນ)?/);
  if (ym) {
    const y = parseInt(ym[1], 10);
    const m = ym[2] ? parseInt(ym[2], 10) : 0;
    return y * 12 + m;
  }
  const mm = t.match(/^(\d+)\s*ເດືອນ/);
  if (mm) {
    return parseInt(mm[1], 10);
  }
  const bare = t.match(/^(\d+)$/);
  if (bare) {
    return parseInt(bare[1], 10);
  }
  return null;
}

/**
 * Calculates month difference between two ISO dates (YYYY-MM-DD).
 * e.g. 2026-02-01 to 2051-02-01 returns 300.
 */
export function calculateMonthsDiff(start: string | null | undefined, end: string | null | undefined): number | null {
  if (!start || !end || end < start) return null;
  const d1 = new Date(start);
  const d2 = new Date(end);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
  const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  return months >= 0 ? months : null;
}

export const displayText = (v: string | null | undefined): string => (v && v.trim() ? v : EMPTY);
