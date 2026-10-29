import type { ModuleKey } from '@/types/domain';

/** One figure on a module card (view model; never a server shape). */
export interface CardMetric {
  id: string;
  label: string;
  value: number;
  tone?: 'emerald' | 'amber';
}

export interface ModuleCardVm {
  module: ModuleKey;
  metrics: CardMetric[];
}

/** Per-module load outcome; a failure never blocks the other modules. */
export type ModuleResult = { ok: true; card: ModuleCardVm } | { ok: false };

export interface UpcomingItem {
  key: string;
  module: 'gc' | 'ppa';
  title: string;
  number: string;
  /** YYYY-MM-DD */
  expirationDate: string;
  href: string;
}

export interface HomeData {
  /** Present only for modules the user can access, in canonical order. */
  modules: Partial<Record<ModuleKey, ModuleResult>>;
  upcoming: UpcomingItem[];
  /** True when at least one upcoming source failed. */
  upcomingFailed: boolean;
}
