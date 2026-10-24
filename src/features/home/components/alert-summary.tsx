import Link from 'next/link';
import { ArrowRight, BellRing } from 'lucide-react';
import { KpiCard } from '@/components/shared/kpi-card';
import { lo } from '@/lib/i18n/lo';
import { formatNumber } from '@/lib/utils/number';
import type { HomeViewModel } from '../types';

export function AlertSummary({ buckets }: { buckets: HomeViewModel['alertBuckets'] }) {
  const total = buckets.within7 + buckets.within30 + buckets.within90;
  const pct7 = total > 0 ? Math.round((buckets.within7 / total) * 100) : 0;
  const pct30 = total > 0 ? Math.round((buckets.within30 / total) * 100) : 0;
  const pct90 = total > 0 ? Math.max(0, 100 - pct7 - pct30) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Urgency Distribution Bar (when alerts exist) */}
      {total > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>ລະດັບຄວາມຮີບດ່ວນ</span>
            <span className="tabular-nums font-medium text-foreground">{formatNumber(total)} ລາຍການ</span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/40">
            {pct7 > 0 ? (
              <div
                style={{ width: `${pct7}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`ພາຍໃນ 7 ມື້: ${buckets.within7}`}
              />
            ) : null}
            {pct30 > 0 ? (
              <div
                style={{ width: `${pct30}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`8–30 ມື້: ${buckets.within30}`}
              />
            ) : null}
            {pct90 > 0 ? (
              <div
                style={{ width: `${pct90}%` }}
                className="bg-sky-500 transition-all duration-500"
                title={`31–90 ມື້: ${buckets.within90}`}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* KPI Cards Grid */}
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
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

      {/* Quick Navigation to Notifications Hub */}
      <div className="pt-2 border-t border-border/40">
        <Link
          href="/notifications"
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/90 transition-colors"
        >
          <BellRing aria-hidden="true" className="size-3.5" />
          <span>{lo.home.viewAllAlerts}</span>
          <ArrowRight aria-hidden="true" className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
