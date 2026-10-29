'use client';

import Link from 'next/link';
import { useEffect, useState, type ElementType, type ReactNode } from 'react';
import { BarChart3, Bell, Coins, FileText, Layers, PieChart, Plus } from 'lucide-react';
import { BarList } from '@/components/charts/bar-list';
import { StackedStatusBar } from '@/components/charts/stacked-status-bar';
import { useCan } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/fade-in';
import { GlassCard } from '@/components/shared/glass-card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/number';
import { STATUS_META } from '@/lib/constants/status';
import { gcService } from '../api/gc.service';
import type { ContractsDashboard } from '../types';
import { SupportCard } from './support-card';

const FOCUS =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';
const CURRENCY_ORDER = ['LAK', 'USD', 'CNY'] as const;

function KpiLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn('block min-w-0 rounded-[20px]', FOCUS)}>
      {children}
    </Link>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon?: ElementType;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon ? (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[var(--gc)]/25 bg-[var(--gc)]/10 text-[var(--gc)]">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-serif text-base font-semibold text-[var(--text-strong)] truncate">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-[11px] text-[var(--text-muted)] truncate">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      {/* Top Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* KPI Section 1 skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[20px]" />
          ))}
        </div>
      </div>

      {/* KPI Section 2 skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[20px]" />
          ))}
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-[20px] lg:col-span-3" />
        <Skeleton className="h-72 rounded-[20px] lg:col-span-2" />
      </div>

      {/* Upcoming & Support skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-[20px] lg:col-span-3" />
        <Skeleton className="h-80 rounded-[20px] lg:col-span-2" />
      </div>
    </div>
  );
}

export function GcDashboardView() {
  const canCreate = useCan('gc', 'create');
  const [data, setData] = useState<ContractsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    gcService
      .dashboard()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e: unknown) => {
        if (active) setError(toUserMessage(normalizeError(e)) || lo.errors.unknown);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    setError(null);
    setData(null);
    setAttempt((n) => n + 1);
  };

  const header = (
    <PageHeader
      eyebrow={MODULES.gc.code}
      title={MODULES.gc.name}
      accent="gc"
      meta={lo.home.gcSubtitle}
      actions={
        data && data.total > 0 ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-xl border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-md"
            >
              <Link href="/contracts/list" className="gap-2">
                <FileText className="size-4 text-[var(--gc)]" />
                <span>{lo.gc.list.title}</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-xl border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-md"
            >
              <Link href="/contracts/alerts" className="gap-2">
                <Bell className="size-4 text-amber-500" />
                <span>{lo.gc.alerts.title}</span>
              </Link>
            </Button>
            {canCreate ? (
              <Button
                size="sm"
                asChild
                className="gap-2 rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white shadow-md hover:brightness-110"
              >
                <Link href="/contracts/new">
                  <Plus className="size-4" />
                  <span>{lo.gc.list.create}</span>
                </Link>
              </Button>
            ) : null}
          </div>
        ) : undefined
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
      <div className="flex flex-col gap-6">
        {header}
        <DashboardSkeleton />
      </div>
    );
  }

  if (data.total === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <GlassCard accent="gc">
          <EmptyState
            title={lo.gc.dashboard.emptyRegister}
            action={
              canCreate ? (
                <Link
                  href="/contracts/new"
                  className={cn(
                    'text-gc inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold underline',
                    FOCUS,
                  )}
                >
                  {lo.gc.list.create}
                </Link>
              ) : undefined
            }
          />
        </GlassCard>
        <SupportCard />
      </div>
    );
  }

  const byType = [...data.byContractType]
    .sort((x, y) => y.count - x.count)
    .map((t) => ({ key: String(t.contractTypeId ?? t.name), label: t.name, value: t.count }));
  const totalsByCurrency = CURRENCY_ORDER.map((currency) => ({
    currency,
    amount: data.valueByCurrency.find((v) => v.currency === currency)?.amount ?? 0,
    count: data.byCurrency.find((v) => v.currency === currency)?.count ?? 0,
  }));

  return (
    <div className="flex flex-col gap-8">
      {header}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-[var(--gc)]/10 text-[var(--gc)]">
              <Layers className="size-3.5" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {lo.gc.dashboard.overview}
            </p>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">{lo.gc.dashboard.overviewHint}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiLink href="/contracts/list">
            <KpiCard
              interactive
              label={lo.gc.dashboard.kpiTotal}
              value={formatNumber(data.total)}
              index={0}
            />
          </KpiLink>
          <KpiLink href="/contracts/list?status=EXPIRING_SOON">
            <KpiCard
              interactive
              label={lo.gc.dashboard.kpiExpiring}
              value={formatNumber(data.expiringSoonCount)}
              variant="warning"
              index={1}
            />
          </KpiLink>
          <KpiLink href="/contracts/list?status=EXPIRED">
            <KpiCard
              interactive
              label={lo.gc.dashboard.kpiExpired}
              value={formatNumber(data.expiredCount)}
              variant="danger"
              index={2}
            />
          </KpiLink>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-[#d4b37a]">
              <Coins className="size-3.5" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {lo.gc.dashboard.valueSection}
            </p>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">{lo.gc.dashboard.valueHint}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {totalsByCurrency.map((v, i) => (
            <KpiCard
              key={v.currency}
              label={lo.gc.dashboard.valueTotal(lo.currency[v.currency])}
              value={formatNumber(v.amount)}
              delta={{ text: lo.gc.dashboard.contractsCount(v.count) }}
              index={3 + i}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
        <FadeIn variant="up" index={6} className="lg:col-span-3">
          <GlassCard accent="gc" className="flex h-full flex-col gap-5 p-6">
            <SectionHeader
              icon={BarChart3}
              title={lo.gc.dashboard.byType}
              subtitle={lo.gc.dashboard.byTypeHint}
              action={
                <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                  {lo.gc.dashboard.typesCount(data.byContractType.length)}
                </span>
              }
            />
            <BarList data={byType} accent="gc" />
          </GlassCard>
        </FadeIn>
        <FadeIn variant="up" index={7} className="lg:col-span-2">
          <GlassCard accent="gc" className="flex h-full flex-col gap-5 p-6">
            <SectionHeader
              icon={PieChart}
              title={lo.gc.dashboard.byStatus}
              subtitle={lo.gc.dashboard.byStatusHint}
            />
            <StackedStatusBar
              data={data.byStatus}
              getLabel={(st) => STATUS_META[st].label}
              getTone={(st) => STATUS_META[st].tone}
            />
          </GlassCard>
        </FadeIn>
      </div>

      <SupportCard index={8} />
    </div>
  );
}
