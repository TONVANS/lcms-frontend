import { KpiCard } from '@/components/shared/kpi-card';
import { lo } from '@/lib/i18n/lo';
import { formatNumber } from '@/lib/utils/number';
import type { HomeViewModel } from '../types';

export function AlertSummary({ buckets }: { buckets: HomeViewModel['alertBuckets'] }) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
      <KpiCard
        label={lo.home.buckets.within7}
        value={formatNumber(buckets.within7)}
        variant="danger"
        index={0}
      />
      <KpiCard
        label={lo.home.buckets.within30}
        value={formatNumber(buckets.within30)}
        variant="warning"
        index={1}
      />
      <KpiCard
        label={lo.home.buckets.within90}
        value={formatNumber(buckets.within90)}
        variant="info"
        index={2}
      />
    </div>
  );
}
