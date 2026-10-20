import { lo } from '@/lib/i18n/lo';

export type CountdownTone = 'urgent' | 'warning' | 'planning';

export function getCountdownTone(days: number): CountdownTone | null {
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'warning';
  if (days <= 90) return 'planning';
  return null;
}

export function formatCountdown(days: number): string {
  if (days === 0) return lo.countdown.today;
  return days > 0 ? lo.countdown.daysLeft(days) : lo.countdown.overdue(-days);
}
