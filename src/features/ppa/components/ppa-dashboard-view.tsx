'use client';

import { Bell, FilePlus2, List, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BarList } from '@/components/charts/bar-list';
import { StackedStatusBar } from '@/components/charts/stacked-status-bar';
import { useCan } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { GlassCard } from '@/components/shared/glass-card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { daysLeft, formatDate } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/number';
import type { ContractStatus } from '@/types/domain';
import { ppaService } from '../api/ppa.service';
import type { PowerContractsDashboard } from '../types';

const MAX_PROJECT_BARS = 8;

export function PpaDashboardView() {
  const canCreate = useCan('ppa', 'create');
  const [data, setData] = useState<PowerContractsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    ppaService
      .dashboard()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e: unknown) => {
        if (active) setError(toUserMessage(normalizeError(e)) || lo.ppa.dashboard.loadError);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setError(null);
    setData(null);
    setAttempt((n) => n + 1);
  }, []);

  const header = (
    <PageHeader
      eyebrow={MODULES.ppa.code}
      title={lo.ppa.dashboard.title}
      meta={lo.ppa.dashboard.subtitle}
      accent="ppa"
      actions={
        <>
          {canCreate ? (
            <Link href="/ppa/new" className={buttonVariants({ variant: 'secondary' })}>
              <FilePlus2 aria-hidden="true" />
              {lo.ppa.list.openWizard}
            </Link>
          ) : null}
          <Link href="/ppa/contracts" className={buttonVariants()}>
            <List aria-hidden="true" />
            {lo.nav.contracts}
          </Link>
        </>
      }
    />
  );

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <AlertBanner
          tone="rose"
          title={error}
          action={
            <Button variant="secondary" onClick={retry}>
              {lo.common.retry}
            </Button>
          }
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        {header}
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

  const expiringCount = data.byStatus.find((s) => s.status === 'EXPIRING_SOON')?.count ?? 0;
  const projectBars = [...data.byProjectType]
    .sort((a, b) => b.capacityMw - a.capacityMw)
    .slice(0, MAX_PROJECT_BARS)
    .map((p) => ({
      key: p.projectType,
      label: p.projectType,
      value: p.capacityMw,
      subValue: `${formatNumber(p.capacityMw)} MW · ${lo.ppa.dashboard.contractsCount(p.count)}`,
    }));

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={lo.ppa.dashboard.kpiTotal} value={formatNumber(data.total)} index={0} />
        <KpiCard label={lo.ppa.dashboard.kpiCapacity} value={formatNumber(data.totalCapacityMw)} index={1} />
        <KpiCard
          label={lo.ppa.dashboard.kpiExpiring}
          value={formatNumber(expiringCount)}
          variant={expiringCount > 0 ? 'warning' : 'default'}
          index={2}
        />
        <KpiCard
          label={lo.ppa.dashboard.purchaseVsSale}
          value={`${formatNumber(data.purchaseCount)} / ${formatNumber(data.saleCount)}`}
          delta={{ text: `${lo.ppa.types.PURCHASE} / ${lo.ppa.types.SALE}` }}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <GlassCard accent="ppa" className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base font-semibold text-(--text-strong)">
                  {lo.ppa.dashboard.byProjectType}
                </h2>
                <p className="text-xs text-(--text-muted)">{lo.ppa.dashboard.byProjectTypeDesc}</p>
              </div>
              <div aria-hidden="true" className="rounded-lg border border-(--ppa)/30 bg-(--ppa)/10 p-2 text-(--ppa)">
                <Zap className="size-4" />
              </div>
            </div>
            {projectBars.length === 0 ? (
              <EmptyState title={lo.table.noData} />
            ) : (
              <BarList data={projectBars} accent="ppa" valueFormatter={(v) => `${formatNumber(v)} MW`} />
            )}
          </GlassCard>

          <GlassCard accent="ppa" className="flex flex-col gap-5 p-6">
            <div>
              <h2 className="font-serif text-base font-semibold text-(--text-strong)">
                {lo.ppa.dashboard.byStatus}
              </h2>
              <p className="text-xs text-(--text-muted)">{lo.ppa.dashboard.byStatusDesc}</p>
            </div>
            <StackedStatusBar<ContractStatus> data={data.byStatus} total={data.total} />
          </GlassCard>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <GlassCard accent="ppa" className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  aria-hidden="true"
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-400"
                >
                  <Bell className="size-4" />
                </div>
                <div>
                  <h2 className="font-serif text-base font-semibold text-(--text-strong)">
                    {lo.ppa.dashboard.expiringList}
                  </h2>
                  <p className="text-xs text-(--text-muted)">{lo.ppa.dashboard.expiringListDesc}</p>
                </div>
              </div>
              <Link href="/ppa/alerts" className="text-xs text-(--ppa) hover:underline">
                {lo.table.all}
              </Link>
            </div>

            {data.expiringSoon.length === 0 ? (
              <EmptyState title={lo.ppa.dashboard.noExpiring} />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {data.expiringSoon.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-(--border-subtle) bg-(--surface-inset) p-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/ppa/contracts/${encodeURIComponent(c.id)}`}
                        className="block truncate text-xs font-medium text-(--text-strong) hover:underline"
                      >
                        {c.projectName || c.contractNumber}
                      </Link>
                      <p className="text-[11px] text-(--text-muted) tabular-nums">
                        {c.contractNumber} · {formatDate(c.expirationDate)}
                      </p>
                    </div>
                    <CountdownBadge days={daysLeft(c.expirationDate)} />
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
