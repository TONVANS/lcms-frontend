'use client';

import { ArrowRight, BookOpen, Plus, Scale } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type ElementType, type ReactNode } from 'react';
import { BarList } from '@/components/charts/bar-list';
import { StackedStatusBar } from '@/components/charts/stacked-status-bar';
import { Can } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { GlassCard } from '@/components/shared/glass-card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/number';
import type { ApiError } from '@/types/api';
import { CASE_STAGE_TONE } from '../../cases/lib/case-money';
import { legalDashboardService } from '../api/legal-dashboard.service';
import type { LegalDashboard } from '../types';

const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';
const D = lo.legal.dashboard;
const F = lo.legal.fields;

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: LegalDashboard }
  | { kind: 'error'; error: ApiError };

function SectionHeader({
  icon: Icon,
  title,
  action,
  accent = 'legal',
}: {
  icon: ElementType;
  title: string;
  action: ReactNode;
  accent?: 'legal' | 'litigation';
}) {
  const iconBorder = accent === 'legal' ? 'border-[var(--legal)]/25' : 'border-[var(--litigation)]/25';
  const iconBg = accent === 'legal' ? 'bg-[var(--legal)]/10 text-[var(--legal)]' : 'bg-[var(--litigation)]/10 text-[var(--litigation)]';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg border', iconBorder, iconBg)}>
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <h2 className="font-serif text-lg font-semibold text-[var(--text-strong)]">{title}</h2>
      </div>
      <div>{action}</div>
    </div>
  );
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mb-4 font-serif text-base font-semibold text-[var(--text-strong)]">
      {children}
    </h3>
  );
}

function DashboardSkeleton() {
  return (
    <div data-testid="legal-dashboard-skeleton" className="flex flex-col gap-8" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function LegalDashboardView() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    legalDashboardService
      .get()
      .then((data) => {
        if (active) setState({ kind: 'ready', data });
      })
      .catch((e: unknown) => {
        if (!active) return;
        setState({ kind: 'error', error: normalizeError(e) });
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const retry = useCallback(() => {
    setState({ kind: 'loading' });
    setReloadKey((k) => k + 1);
  }, []);

  if (state.kind === 'loading') {
    return <DashboardSkeleton />;
  }

  if (state.kind === 'error') {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow={MODULES.legal.code} title={D.title} accent="legal" />
        <AlertBanner
          tone="rose"
          title={toUserMessage(state.error)}
          action={
            <Button variant="secondary" onClick={retry}>
              {lo.common.retry}
            </Button>
          }
        />
      </div>
    );
  }

  const { regulations, cases } = state.data;

  const regTypeData = regulations.byType.map((t) => ({
    key: t.type,
    label: lo.legal.regulationTypes[t.type],
    value: t.count,
  }));

  const regUnitData = regulations.byUnit.slice(0, 12).map((u) => ({
    key: u.unit,
    label: lo.legal.units[u.unit],
    value: u.count,
  }));

  const caseStageData = cases.byStage.map((s) => ({
    status: s.stage,
    count: s.count,
  }));

  const moneyCompareLak = [
    { key: 'damage', label: F.damage, value: cases.damage.lak },
    { key: 'fine', label: F.fine, value: cases.fine.lak },
    { key: 'recovered', label: F.recovered, value: cases.recovered.lak },
  ];

  const moneyCompareUsd = [
    { key: 'damage', label: F.damage, value: cases.damage.usd },
    { key: 'fine', label: F.fine, value: cases.fine.usd },
    { key: 'recovered', label: F.recovered, value: cases.recovered.usd },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <PageHeader
        eyebrow={MODULES.legal.code}
        title={D.title}
        accent="legal"
        actions={
          <Can module="legal" permission="create">
            <Button asChild variant="gold">
              <Link href="/legal/new" className={FOCUS_RING}>
                <Plus aria-hidden="true" />
                {D.new}
              </Link>
            </Button>
          </Can>
        }
      />

      {/* Regulations Section */}
      <section aria-labelledby="dashboard-regulations-heading" className="flex flex-col gap-4">
        <SectionHeader
          icon={BookOpen}
          title={D.regulationsSection}
          accent="legal"
          action={
            <Link
              href="/legal/regulations"
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-strong)]',
                FOCUS_RING,
              )}
            >
              <span>{D.viewAllRegulations}</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label={D.regulations.total} value={regulations.total} />
          <KpiCard label={D.regulations.inForce} value={regulations.byStatus.in_force} />
          <KpiCard label={D.regulations.repealed} value={regulations.byStatus.repealed} />
          <KpiCard label={D.regulations.units} value={regulations.unitCount} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard className="p-5 sm:p-6">
            <SectionTitle id="reg-by-type-title">{D.regulations.byType}</SectionTitle>
            <BarList data={regTypeData} accent="legal" />
          </GlassCard>
          <GlassCard className="p-5 sm:p-6">
            <SectionTitle id="reg-by-unit-title">{D.regulations.byUnit}</SectionTitle>
            <BarList data={regUnitData} accent="legal" />
          </GlassCard>
        </div>
      </section>

      {/* Cases Section */}
      <section aria-labelledby="dashboard-cases-heading" className="flex flex-col gap-4">
        <SectionHeader
          icon={Scale}
          title={D.casesSection}
          accent="litigation"
          action={
            <Link
              href="/legal/cases"
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-strong)]',
                FOCUS_RING,
              )}
            >
              <span>{D.viewAllCases}</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />

        {/* Count KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label={D.cases.total} value={cases.total} />
          <KpiCard label={D.cases.inProgress} value={cases.inProgress} />
          <KpiCard label={D.cases.finished} value={cases.finished} />
        </div>

        {/* Money KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={D.cases.damageFineLak}
            value={formatNumber(cases.damage.lak + cases.fine.lak)}
          />
          <KpiCard
            label={D.cases.damageFineUsd}
            value={formatNumber(cases.damage.usd + cases.fine.usd)}
          />
          <KpiCard label={D.cases.recoveredLak} value={formatNumber(cases.recovered.lak)} />
          <KpiCard label={D.cases.recoveredUsd} value={formatNumber(cases.recovered.usd)} />
        </div>

        {/* Stage StatusBar */}
        <GlassCard className="p-5 sm:p-6">
          <SectionTitle id="cases-stage-title">{D.cases.byStage}</SectionTitle>
          <div data-testid="cases-stage-bar" className="py-2">
            <StackedStatusBar
              data={caseStageData}
              getLabel={(s) => lo.legal.caseStages[s]}
              getTone={(s) => CASE_STAGE_TONE[s]}
            />
          </div>
        </GlassCard>

        {/* Money Comparison Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard className="p-5 sm:p-6">
            <SectionTitle id="cases-money-lak-title">{D.cases.moneyComparisonLak}</SectionTitle>
            <BarList data={moneyCompareLak} accent="litigation" />
          </GlassCard>
          <GlassCard className="p-5 sm:p-6">
            <SectionTitle id="cases-money-usd-title">{D.cases.moneyComparisonUsd}</SectionTitle>
            <BarList data={moneyCompareUsd} accent="litigation" />
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
