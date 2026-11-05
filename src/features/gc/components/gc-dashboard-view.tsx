'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ElementType, type FormEvent, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Coins,
  FileSignature,
  FileText,
  Layers,
  PieChart,
  Plus,
  Search,
  ShieldAlert,
  Wallet,
  X,
} from 'lucide-react';
import { BarList } from '@/components/charts/bar-list';
import { StackedStatusBar } from '@/components/charts/stacked-status-bar';
import { useCan } from '@/components/guards/can';
import { AlertBanner } from '@/components/shared/alert-banner';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/fade-in';
import { GlassCard } from '@/components/shared/glass-card';
import { ContractStatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { STATUS_META } from '@/lib/constants/status';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/number';
import type { Currency } from '@/types/domain';
import { gcService } from '../api/gc.service';
import type { ContractsDashboard } from '../types';

const FOCUS =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

const CURRENCY_ORDER: readonly Currency[] = ['LAK', 'USD', 'CNY'];

const CURRENCY_CONFIG: Record<
  Currency,
  {
    symbol: string;
    label: string;
    colorClass: string;
    badgeClass: string;
    bgClass: string;
  }
> = {
  LAK: {
    symbol: '₭',
    label: 'ກີບລາວ (LAK)',
    colorClass: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    bgClass: 'from-blue-600/10 to-indigo-600/5',
  },
  USD: {
    symbol: '$',
    label: 'ໂດລາສະຫະລັດ (USD)',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    bgClass: 'from-emerald-600/10 to-teal-600/5',
  },
  CNY: {
    symbol: '¥',
    label: 'ຢວນຈີນ (CNY)',
    colorClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    bgClass: 'from-amber-600/10 to-orange-600/5',
  },
};

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
      {/* Hero skeleton */}
      <Skeleton className="h-44 w-full rounded-[24px]" />

      {/* Quick filter pills skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>

      {/* Operational 4 KPIs skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[20px]" />
        ))}
      </div>

      {/* Currency Portfolio skeleton */}
      <Skeleton className="h-44 rounded-[20px]" />

      {/* Analytics Charts skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-[20px] lg:col-span-3" />
        <Skeleton className="h-80 rounded-[20px] lg:col-span-2" />
      </div>
    </div>
  );
}

export function GcDashboardView() {
  const router = useRouter();
  const canCreate = useCan('gc', 'create');

  const [data, setData] = useState<ContractsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Quick search input state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;

    gcService
      .dashboard()
      .then((dashboardData) => {
        if (active) {
          setData(dashboardData);
        }
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

  const handleQuickSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/contracts/list?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/contracts/list');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col gap-6">
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
    return <DashboardSkeleton />;
  }

  if (data.total === 0) {
    return (
      <div className="flex flex-col gap-8">
        {/* Executive Hero */}
        <section className="relative overflow-hidden rounded-[24px] border border-white/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,255,255,0.68))] p-6 sm:p-8 backdrop-blur-xl shadow-[inset_0_1px_0_#fff,0_20px_40px_-24px_rgba(15,35,80,0.18)] dark:border-[rgba(212,179,122,0.25)] dark:bg-[linear-gradient(160deg,rgba(30,58,138,0.35),rgba(19,41,79,0.25))] dark:shadow-lg">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--gc)]/80 to-transparent"
          />
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--gc)]/25 bg-[var(--gc)]/10 px-3 py-1 text-xs font-semibold text-[var(--gc)]">
              <FileSignature className="size-3.5" aria-hidden="true" />
              <span>{MODULES.gc.code} • GENERAL CONTRACTS</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-strong)]">
              {MODULES.gc.name}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl">
              {lo.home.gcSubtitle}
            </p>
          </div>
        </section>

        <GlassCard accent="gc">
          <EmptyState
            title={lo.gc.dashboard.emptyRegister}
            description="ຍັງບໍ່ມີຂໍ້ມູນສັນຍາໃນລະບົບ ກະລຸນາເລີ່ມຕົ້ນດ້ວຍການສ້າງສັນຍາສະບັບທຳອິດ"
            action={
              canCreate ? (
                <Button asChild className="gap-2 rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white">
                  <Link href="/contracts/new">
                    <Plus className="size-4" />
                    <span>{lo.gc.list.create}</span>
                  </Link>
                </Button>
              ) : undefined
            }
          />
        </GlassCard>
      </div>
    );
  }

  const activeCount = data.byStatus.find((s) => s.status === 'ACTIVE')?.count ?? 0;
  const draftCount = data.byStatus.find((s) => s.status === 'DRAFT')?.count ?? 0;
  const attentionCount = data.expiringSoonCount + data.expiredCount;

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
      {/* 1. Executive Hero Header & Quick Command Center */}
      <section className="relative overflow-hidden rounded-[24px] border border-white/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,255,255,0.68))] p-6 sm:p-8 backdrop-blur-xl shadow-[inset_0_1px_0_#fff,0_20px_40px_-24px_rgba(15,35,80,0.18)] dark:border-[rgba(212,179,122,0.25)] dark:bg-[linear-gradient(160deg,rgba(30,58,138,0.35),rgba(19,41,79,0.25))] dark:shadow-lg">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--gc)]/80 to-transparent"
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left Title & Status Indicator */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gc)]/25 bg-[var(--gc)]/10 px-3 py-1 text-xs font-semibold text-[var(--gc)]">
                <FileSignature className="size-3.5" aria-hidden="true" />
                <span>{MODULES.gc.code} • GENERAL CONTRACTS</span>
              </div>

              {attentionCount > 0 ? (
                <Link
                  href="/contracts/alerts"
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300 transition-colors hover:bg-amber-500/20"
                >
                  <AlertTriangle className="size-3" />
                  <span>ມີ {formatNumber(attentionCount)} ສັນຍາຕ້ອງການຄວາມສົນໃຈ</span>
                </Link>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-3" />
                  <span>ລະບົບສັນຍາປົກກະຕິ</span>
                </div>
              )}
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-strong)] leading-tight">
              {MODULES.gc.name}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl">
              {lo.home.gcSubtitle}
            </p>
          </div>

          {/* Right: Quick Search & Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Quick search input */}
            <form onSubmit={handleQuickSearch} className="relative min-w-[240px] sm:w-64">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ຄົ້ນຫາສັນຍາ..."
                aria-label="ຄົ້ນຫາສັນຍາທົ່ວໄປ"
                className={cn(
                  'h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-glass)] pl-9 pr-8 text-xs text-[var(--text-strong)] placeholder:text-[var(--text-muted)] backdrop-blur-md transition-all',
                  'focus:border-[var(--gc)] focus:bg-[var(--surface-raised)] focus:outline-none',
                  FOCUS,
                )}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="ລຶບຄຳຄົ້ນຫາ"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </form>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-10 rounded-xl border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-md"
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
                className="relative h-10 rounded-xl border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-md"
              >
                <Link href="/contracts/alerts" className="gap-2">
                  <Bell className="size-4 text-amber-500" />
                  <span>{lo.gc.alerts.title}</span>
                  {data.expiringSoonCount > 0 ? (
                    <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                      {data.expiringSoonCount}
                    </span>
                  ) : null}
                </Link>
              </Button>

              {canCreate ? (
                <Button
                  size="sm"
                  asChild
                  className="h-10 gap-2 rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white shadow-md hover:brightness-110"
                >
                  <Link href="/contracts/new">
                    <Plus className="size-4" />
                    <span>{lo.gc.list.create}</span>
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Status Filter Pills (Quick-Jump) */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-xs font-semibold text-[var(--text-muted)] mr-1">ທາງລັດ:</span>
        <Link
          href="/contracts/list"
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-glass)] px-3 py-1 text-xs font-medium text-[var(--text-strong)] hover:border-[var(--gc)] hover:bg-[var(--surface-inset)] transition-colors',
            FOCUS,
          )}
        >
          <span>ທັງໝົດ</span>
          <span className="rounded-full bg-[var(--surface-inset)] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
            {formatNumber(data.total)}
          </span>
        </Link>
        <Link
          href="/contracts/list?status=ACTIVE"
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors',
            FOCUS,
          )}
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>{lo.status.ACTIVE}</span>
          <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
            {formatNumber(activeCount)}
          </span>
        </Link>
        <Link
          href="/contracts/list?status=EXPIRING_SOON"
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors',
            FOCUS,
          )}
        >
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>{lo.status.EXPIRING_SOON}</span>
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
            {formatNumber(data.expiringSoonCount)}
          </span>
        </Link>
        <Link
          href="/contracts/list?status=EXPIRED"
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-colors',
            FOCUS,
          )}
        >
          <span className="size-1.5 rounded-full bg-rose-500" />
          <span>{lo.status.EXPIRED}</span>
          <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
            {formatNumber(data.expiredCount)}
          </span>
        </Link>
        <Link
          href="/contracts/list?status=DRAFT"
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-slate-500/30 bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-500/20 transition-colors',
            FOCUS,
          )}
        >
          <span className="size-1.5 rounded-full bg-slate-400" />
          <span>{lo.status.DRAFT}</span>
          <span className="rounded-full bg-slate-500/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
            {formatNumber(draftCount)}
          </span>
        </Link>
      </div>

      {/* 3. Core Operational KPIs (4 Metrics Grid) */}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Contracts */}
          <FadeIn variant="up" index={0}>
            <Link href="/contracts/list" className={cn('block rounded-[20px]', FOCUS)}>
              <GlassCard interactive className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-[13px] text-[var(--text-muted)] font-medium">
                    {lo.gc.dashboard.kpiTotal}
                  </p>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--gc)]/10 text-[var(--gc)]">
                    <FileText className="size-4" />
                  </div>
                </div>
                <p className="mt-2 font-serif text-[34px] leading-tight font-semibold tabular-nums text-[var(--text-strong)]">
                  {formatNumber(data.total)}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <span>ທັງໝົດໃນລະບົບ</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </p>
              </GlassCard>
            </Link>
          </FadeIn>

          {/* Active Contracts */}
          <FadeIn variant="up" index={1}>
            <Link href="/contracts/list?status=ACTIVE" className={cn('block rounded-[20px]', FOCUS)}>
              <GlassCard
                interactive
                className="p-5 [--glass-bg:linear-gradient(160deg,rgba(5,150,105,0.12),rgba(5,150,105,0.03))] [--glass-border:rgba(5,150,105,0.25)]"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[13px] text-[var(--text-muted)] font-medium">
                    {lo.status.ACTIVE}
                  </p>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                  </div>
                </div>
                <p className="mt-2 font-serif text-[34px] leading-tight font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {formatNumber(activeCount)}
                </p>
                <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80 tabular-nums">
                  {data.total > 0
                    ? `${Math.round((activeCount / data.total) * 100)}% ຂອງສັນຍາທັງໝົດ`
                    : 'ບໍ່ມີສັນຍາ'}
                </p>
              </GlassCard>
            </Link>
          </FadeIn>

          {/* Expiring Soon */}
          <FadeIn variant="up" index={2}>
            <Link
              href="/contracts/list?status=EXPIRING_SOON"
              className={cn('block rounded-[20px]', FOCUS)}
            >
              <GlassCard
                interactive
                className={cn(
                  'p-5',
                  data.expiringSoonCount > 0
                    ? '[--glass-bg:linear-gradient(160deg,rgba(251,191,36,0.14),rgba(251,191,36,0.04))] [--glass-border:rgba(251,191,36,0.35)]'
                    : '',
                )}
              >
                <div className="flex items-start justify-between">
                  <p className="text-[13px] text-[var(--text-muted)] font-medium">
                    {lo.gc.dashboard.kpiExpiring}
                  </p>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Clock className="size-4" />
                  </div>
                </div>
                <p
                  className={cn(
                    'mt-2 font-serif text-[34px] leading-tight font-semibold tabular-nums',
                    data.expiringSoonCount > 0
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-[var(--text-strong)]',
                  )}
                >
                  {formatNumber(data.expiringSoonCount)}
                </p>
                <p
                  className={cn(
                    'mt-1 text-xs tabular-nums',
                    data.expiringSoonCount > 0
                      ? 'font-medium text-amber-600 dark:text-amber-400'
                      : 'text-[var(--text-muted)]',
                  )}
                >
                  {data.expiringSoonCount > 0 ? 'ຕ້ອງການກວດສອບ & ຕໍ່ອາຍຸ' : 'ບໍ່ມີສັນຍາໃກ້ໝົດອາຍຸ'}
                </p>
              </GlassCard>
            </Link>
          </FadeIn>

          {/* Expired */}
          <FadeIn variant="up" index={3}>
            <Link href="/contracts/list?status=EXPIRED" className={cn('block rounded-[20px]', FOCUS)}>
              <GlassCard
                interactive
                className={cn(
                  'p-5',
                  data.expiredCount > 0
                    ? '[--glass-bg:linear-gradient(160deg,rgba(251,113,133,0.14),rgba(251,113,133,0.04))] [--glass-border:rgba(251,113,133,0.35)]'
                    : '',
                )}
              >
                <div className="flex items-start justify-between">
                  <p className="text-[13px] text-[var(--text-muted)] font-medium">
                    {lo.gc.dashboard.kpiExpired}
                  </p>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="size-4" />
                  </div>
                </div>
                <p
                  className={cn(
                    'mt-2 font-serif text-[34px] leading-tight font-semibold tabular-nums',
                    data.expiredCount > 0
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-[var(--text-strong)]',
                  )}
                >
                  {formatNumber(data.expiredCount)}
                </p>
                <p
                  className={cn(
                    'mt-1 text-xs tabular-nums',
                    data.expiredCount > 0
                      ? 'font-medium text-rose-600 dark:text-rose-400'
                      : 'text-[var(--text-muted)]',
                  )}
                >
                  {data.expiredCount > 0 ? 'ສັນຍາສິ້ນສຸດກຳນົດ' : 'ບໍ່ມີສັນຍາໝົດອາຍຸ'}
                </p>
              </GlassCard>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* 4. Financial Portfolio Section (By Currency) */}
      <FadeIn variant="up" index={4}>
        <GlassCard accent="gc" className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Coins className="size-4.5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-base font-semibold text-[var(--text-strong)]">
                  {lo.gc.dashboard.valueSection}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">{lo.gc.dashboard.valueHint}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Wallet className="size-3.5" />
              <span>3 ສະກຸນເງິນຫຼັກ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {totalsByCurrency.map((v) => {
              const cfg = CURRENCY_CONFIG[v.currency];
              return (
                <div
                  key={v.currency}
                  className={cn(
                    'flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br p-4 sm:p-5 transition-shadow hover:shadow-md',
                    cfg.bgClass,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                        cfg.badgeClass,
                      )}
                    >
                      <span className="font-bold">{cfg.symbol}</span>
                      <span>{v.currency}</span>
                    </span>
                    <span className="text-[11px] font-medium text-[var(--text-muted)]">
                      {lo.gc.dashboard.contractsCount(v.count)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-[var(--text-muted)]">{cfg.label}</p>
                    <p className="mt-1 font-serif text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--text-strong)] truncate">
                      {formatNumber(v.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </FadeIn>

      {/* 5. Analytics Deck: Contract Types & Status Lifecycle */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
        {/* Left: Contract Types Breakdown (3 columns) */}
        <FadeIn variant="up" index={5} className="lg:col-span-3">
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

            {byType.length === 0 ? (
              <EmptyState title={lo.table.noData} />
            ) : (
              <div className="flex flex-col gap-4">
                <BarList data={byType} accent="gc" />
                <div className="flex justify-end pt-2 border-t border-[var(--border-subtle)]">
                  <Link
                    href="/contracts/list"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--gc)] hover:underline"
                  >
                    <span>{lo.gc.list.title}</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            )}
          </GlassCard>
        </FadeIn>

        {/* Right: Status Distribution & Lifecycle Drilldown (2 columns) */}
        <FadeIn variant="up" index={6} className="lg:col-span-2">
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

            {/* Interactive Status Drilldown List */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                ລາຍລະອຽດສະຖານະ (ຄລິກເພື່ອກັ່ນຕອງ)
              </p>
              <div className="flex flex-col gap-1.5">
                {data.byStatus.map((seg) => {
                  const percent = data.total > 0 ? (seg.count / data.total) * 100 : 0;
                  return (
                    <Link
                      key={seg.status}
                      href={`/contracts/list?status=${seg.status}`}
                      className={cn(
                        'group flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors hover:bg-[var(--surface-inset)]',
                        FOCUS,
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ContractStatusBadge status={seg.status} />
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold tabular-nums text-xs text-[var(--text-strong)]">
                          {formatNumber(seg.count)}
                        </span>
                        <span className="text-[11px] tabular-nums text-[var(--text-muted)] w-10 text-right">
                          {percent.toFixed(0)}%
                        </span>
                        <ArrowUpRight className="size-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </FadeIn>
      </div>
      {/* 6. Support & Assistance */}
      {/* <SupportCard index={7} /> */}
    </div>
  );
}
