'use client';

import { Bell, FilePlus2, Plus, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { BarList } from '@/components/charts/bar-list';
import { MonthlyBars } from '@/components/charts/monthly-bars';
import { StackedStatusBar } from '@/components/charts/stacked-status-bar';
import { AlertBanner } from '@/components/shared/alert-banner';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { GlassCard } from '@/components/shared/glass-card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/number';
import { ppaService } from '../api/ppa.service';
import type { PpaDashboardSummary } from '../types';

export function PpaDashboardView() {
  const [data, setData] = useState<PpaDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = () => {
    setIsLoading(true);
    setError(null);
    ppaService
      .dashboard()
      .then((summary) => {
        setData(summary);
        setIsLoading(false);
      })
      .catch(() => {
        setError(lo.errors.server);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    ppaService
      .dashboard()
      .then((summary) => {
        if (active) {
          setData(summary);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(lo.errors.server);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="PPA" title={lo.nav.dashboard} accent="ppa" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="PPA" title={lo.nav.dashboard} accent="ppa" />
        <AlertBanner
          tone="rose"
          title={lo.errors.unknown}
          description={error ?? ''}
          action={
            <Button variant="secondary" size="default" onClick={fetchDashboard}>
              {lo.common.retry}
            </Button>
          }
        />
      </div>
    );
  }

  const { kpis, energyBreakdown, statusBreakdown, monthlyExpiring, upcomingAlerts } = data;

  const barListData = energyBreakdown.map((e) => ({
    key: e.energyType,
    label: e.label,
    value: e.capacityMw,
    subValue: `${formatNumber(e.capacityMw)} MW (${e.percentage}%)`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="PPA"
        title="ພາບລວມ ສັນຍາຊື້-ຂາຍພະລັງງານ"
        meta="ສະຫຼຸບຂໍ້ມູນກຳລັງການຜະລິດ, ສະຖານະສັນຍາ ແລະ ກຳນົດເວລາສຳຄັນ"
        accent="ppa"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/ppa/new">
              <Button variant="secondary" className="gap-2">
                <FilePlus2 className="h-4 w-4" />
                <span>{lo.ppa.actions.createWizard}</span>
              </Button>
            </Link>
            <Link href="/ppa/contracts">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span>{lo.nav.contracts}</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={lo.ppa.kpi.total}
          value={kpis.totalContracts}
          variant="default"
          index={0}
        />
        <KpiCard
          label={lo.ppa.kpi.activeCapacity}
          value={`${formatNumber(kpis.activeCapacityMw)}`}
          variant="default"
          index={1}
        />
        <KpiCard
          label={lo.ppa.kpi.expiring}
          value={kpis.expiringCount}
          variant={kpis.expiringCount > 0 ? 'warning' : 'default'}
          index={2}
        />
        <KpiCard
          label={lo.ppa.kpi.avgTariff}
          value={`${kpis.avgTariff}`}
          variant="default"
          index={3}
        />
      </div>

      {/* Two-Column Section (3:2 ratio per Design.md §5) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left column (col-span-3) */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Energy Breakdown */}
          <GlassCard accent="ppa" className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-semibold text-[var(--text-strong)]">
                  ກຳລັງຕິດຕັ້ງແຍກຕາມປະເພດພະລັງງານ (MW)
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  ສັດສ່ວນກຳລັງການຜະລິດຂອງສັນຍາທັງໝົດ
                </p>
              </div>
              <div className="rounded-lg bg-[var(--ppa)]/10 p-2 text-[var(--ppa)] border border-[var(--ppa)]/30">
                <Zap className="h-4 w-4" />
              </div>
            </div>

            <BarList data={barListData} accent="ppa" valueFormatter={(v) => `${formatNumber(v)} MW`} />
          </GlassCard>

          {/* Monthly Expiration */}
          <GlassCard accent="ppa" className="flex flex-col gap-4 p-6">
            <div>
              <h3 className="font-serif text-base font-semibold text-[var(--text-strong)]">
                ກຳນົດເວລາສັນຍາໝົດອາຍຸ (6 ເດືອນຂ້າງໜ້າ)
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                ຈຳນວນສັນຍາທີ່ຈະສິ້ນສຸດລົງໃນແຕ່ລະເດືອນ
              </p>
            </div>
            <MonthlyBars data={monthlyExpiring} accent="ppa" height={190} />
          </GlassCard>
        </div>

        {/* Right column (col-span-2) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Status Breakdown */}
          <GlassCard accent="ppa" className="flex flex-col gap-5 p-6">
            <div>
              <h3 className="font-serif text-base font-semibold text-[var(--text-strong)]">
                ສະຖານະສັນຍາ
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                ການແບ່ງກຸ່ມສັນຍາຕາມຂັ້ນຕອນການດຳເນີນງານ
              </p>
            </div>
            <StackedStatusBar data={statusBreakdown} />
          </GlassCard>

          {/* Upcoming Alerts */}
          <GlassCard accent="ppa" className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/30">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-[var(--text-strong)]">
                    ການແຈ້ງເຕືອນສັນຍາໃກ້ໝົດອາຍຸ
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    ລາຍການທີ່ຕ້ອງດຳເນີນການດ່ວນ
                  </p>
                </div>
              </div>
              <Link href="/ppa/alerts" className="text-xs text-[var(--ppa)] hover:underline">
                {lo.table.all}
              </Link>
            </div>

            {upcomingAlerts.length === 0 ? (
              <EmptyState title="ບໍ່ມີການແຈ້ງເຕືອນດ່ວນ" />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {upcomingAlerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3 transition-colors hover:border-[var(--border-glass)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[var(--text-strong)]">
                        {alert.title}
                      </p>
                      <p className="text-[11px] tabular-nums text-[var(--text-muted)]">
                        {formatDate(alert.dueDate)}
                      </p>
                    </div>
                    <CountdownBadge days={alert.daysLeft} />
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
