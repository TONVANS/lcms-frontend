'use client';

import Link from 'next/link';
import { useEffect, useState, type ElementType, type ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Clock,
  Coins,
  FileText,
  Layers,
  PieChart,
  Plus,
} from 'lucide-react';
import { BarList } from '@/components/charts/bar-list';
import { StackedStatusBar } from '@/components/charts/stacked-status-bar';
import { useCan } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { CountdownBadge } from '@/components/shared/countdown-badge';
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
import { daysLeft, formatDate } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/number';
import { gcService, type GcDashboard } from '../api/gc.service';
import { GC_STATUS_TONE } from '../lib/derive-status';
import { GC_STATUSES } from '../types';
import { SupportCard } from './support-card';

const FOCUS =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';
// Defensive: the handler already caps upcoming at 10.
const UPCOMING_MAX = 10;
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
  const [data, setData] = useState<GcDashboard | null>(null);
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

  const byType = [...data.byType]
    .sort((a, b) => b.count - a.count)
    .map((t) => ({ key: t.type, label: lo.gc.types[t.type], value: t.count }));
  const statusData = GC_STATUSES.map((status) => ({ status, count: data.byStatus[status] ?? 0 }));
  const totalsByCurrency = CURRENCY_ORDER.map(
    (currency) =>
      data.valueTotals.find((v) => v.currency === currency) ?? { currency, amount: 0, count: 0 },
  );
  const upcoming = data.upcoming.slice(0, UPCOMING_MAX);
  const today = new Date();

  return (
    <div className="flex flex-col gap-8">
      {header}

      {/* 1. Status Overview Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-[var(--gc)]/10 text-[var(--gc)]">
              <Layers className="size-3.5" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              ພາບລວມສະຖານະສັນຍາ
            </p>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            ຄລິກໃສ່ກາດເພື່ອເບິ່ງລາຍການສັນຍາ
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiLink href="/contracts/list">
            <KpiCard
              interactive
              label={lo.gc.dashboard.kpiTotal}
              value={formatNumber(data.total)}
              index={0}
            />
          </KpiLink>
          <KpiLink href="/contracts/list?status=active">
            <KpiCard
              interactive
              label={lo.gc.dashboard.kpiActive}
              value={formatNumber(data.byStatus.active)}
              index={1}
            />
          </KpiLink>
          <KpiLink href="/contracts/list?status=expiring">
            <KpiCard
              interactive
              label={lo.gc.dashboard.kpiExpiring}
              value={formatNumber(data.byStatus.expiring)}
              variant="warning"
              index={2}
            />
          </KpiLink>
          <KpiLink href="/contracts/list?status=expired">
            <KpiCard
              interactive
              label={lo.gc.dashboard.kpiExpired}
              value={formatNumber(data.byStatus.expired)}
              variant="danger"
              index={3}
            />
          </KpiLink>
        </div>
      </section>

      {/* 2. Financial Exposure by Currency */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-[#d4b37a]">
              <Coins className="size-3.5" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              ມູນຄ່າລວມຕາມສະກຸນເງິນ
            </p>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            ຍອດມູນຄ່າຕົວຈິງໂດຍບໍ່ມີການແປງຄ່າ
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {totalsByCurrency.map((v, i) => (
            <KpiCard
              key={v.currency}
              label={lo.gc.dashboard.valueTotal(lo.currency[v.currency])}
              value={formatNumber(v.amount)}
              delta={{ text: lo.gc.dashboard.contractsCount(v.count) }}
              index={4 + i}
            />
          ))}
        </div>
      </section>

      {/* 3. Analytics & Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
        <FadeIn variant="up" index={7} className="lg:col-span-3">
          <GlassCard accent="gc" className="flex h-full flex-col gap-5 p-6">
            <SectionHeader
              icon={BarChart3}
              title={lo.gc.dashboard.byType}
              subtitle="ຈຳນວນສັນຍາແຍກຕາມແຕ່ລະປະເພດສັນຍາ"
              action={
                <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                  {data.byType.length} ປະເພດ
                </span>
              }
            />
            <BarList data={byType} accent="gc" orientation="vertical" />
          </GlassCard>
        </FadeIn>
        <FadeIn variant="up" index={8} className="lg:col-span-2">
          <GlassCard accent="gc" className="flex h-full flex-col gap-5 p-6">
            <SectionHeader
              icon={PieChart}
              title={lo.gc.dashboard.byStatus}
              subtitle="ສັດສ່ວນສະຖານະສັນຍາທັງໝົດ"
            />
            <StackedStatusBar
              data={statusData}
              getLabel={(s) => lo.gc.status[s]}
              getTone={(s) => GC_STATUS_TONE[s]}
            />
          </GlassCard>
        </FadeIn>
      </div>

      {/* 4. Upcoming Deadlines & Support */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <FadeIn variant="up" index={9} className="lg:col-span-3">
          <GlassCard as="section" accent="gc" className="flex h-full flex-col gap-4 p-6">
            <SectionHeader
              icon={Clock}
              title={lo.gc.dashboard.upcoming90}
              subtitle="ຕິດຕາມກຳນົດເວລາ ແລະ ພັນທະທີ່ໃກ້ສິ້ນສຸດ"
              action={
                upcoming.length > 0 ? (
                  <Link
                    href="/contracts/alerts"
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-semibold text-[var(--gc)] hover:underline',
                      FOCUS,
                    )}
                  >
                    <span>{lo.home.viewAllAlerts}</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                ) : null
              }
            />
            {upcoming.length === 0 ? (
              <EmptyState title={lo.gc.dashboard.noUpcoming} />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {upcoming.map((c) => (
                  <li
                    key={c.id}
                    className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3.5 transition-all duration-200 hover:border-[var(--gc)]/50 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-glass)] text-[var(--gc)] group-hover:bg-[var(--gc)]/10 transition-colors">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/contracts/${c.id}`}
                          className={cn(
                            'flex min-h-11 items-center truncate rounded-sm text-sm font-semibold text-[var(--text-strong)] underline-offset-2 hover:underline group-hover:text-[var(--gc)] transition-colors',
                            FOCUS,
                          )}
                        >
                          {c.title}
                        </Link>
                        <p className="text-[11px] text-[var(--text-muted)] tabular-nums">
                          {c.contractNo} · {formatDate(c.endDate)}
                        </p>
                      </div>
                    </div>
                    <CountdownBadge days={daysLeft(c.endDate, today)} />
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </FadeIn>
        <div className="lg:col-span-2">
          <SupportCard index={10} />
        </div>
      </div>
    </div>
  );
}

