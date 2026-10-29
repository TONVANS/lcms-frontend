'use client';

import { Scale } from 'lucide-react';
import { BarList } from '@/components/charts/bar-list';
import { StackedStatusBar } from '@/components/charts/stacked-status-bar';
import { AlertBanner } from '@/components/shared/alert-banner';
import { GlassCard } from '@/components/shared/glass-card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Button } from '@/components/ui/button';
import { toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { formatNumber } from '@/lib/utils/number';
import { SectionHeader, SectionSkeleton } from '../../lib/section-header';
import { useRecord } from '../../lib/use-record';
import { legalCasesService } from '../api/legal-cases.service';
import { DISPUTE_STATUS_TONE } from '../types';

const D = lo.legal.dashboard;
const F = lo.legal.fields;

const fetchDashboard = () => legalCasesService.dashboard();

/** Dashboard block for legal cases: counts by court stage and LAK / USD money totals. */
export function LegalCasesDashboardSection() {
  const { state, retry } = useRecord('dashboard', fetchDashboard);

  return (
    <section aria-labelledby="dashboard-cases-heading" className="flex flex-col gap-4">
      <SectionHeader
        id="dashboard-cases-heading"
        icon={Scale}
        title={D.casesSection}
        accent="litigation"
        href="/legal/cases"
        linkLabel={D.viewAllCases}
      />
      {state.kind === 'loading' ? <SectionSkeleton testId="legal-cases-dashboard-skeleton" /> : null}
      {state.kind === 'error' || state.kind === 'notFound' ? (
        <AlertBanner
          tone="rose"
          title={state.kind === 'error' ? toUserMessage(state.error) : lo.errors.unknown}
          action={
            <Button variant="secondary" onClick={retry}>
              {lo.common.retry}
            </Button>
          }
        />
      ) : null}
      {state.kind === 'ready' ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label={D.cases.total} value={state.record.total} />
            <KpiCard label={D.cases.totalDueLak} value={formatNumber(state.record.lak.totalDue)} />
            <KpiCard label={D.cases.totalDueUsd} value={formatNumber(state.record.usd.totalDue)} />
            <KpiCard label={D.cases.recoveredLak} value={formatNumber(state.record.lak.recovered)} />
            <KpiCard label={D.cases.damageLak} value={formatNumber(state.record.lak.damage)} />
            <KpiCard label={D.cases.damageUsd} value={formatNumber(state.record.usd.damage)} />
            <KpiCard label={D.cases.fineLak} value={formatNumber(state.record.lak.fine)} />
            <KpiCard label={D.cases.recoveredUsd} value={formatNumber(state.record.usd.recovered)} />
          </div>

          <GlassCard className="p-5 sm:p-6">
            <h3 className="mb-4 font-serif text-base font-semibold text-[var(--text-strong)]">
              {D.cases.byStatus}
            </h3>
            <div data-testid="cases-stage-bar" className="py-2">
              <StackedStatusBar
                data={state.record.byDisputeStatus.map((s) => ({ status: s.status, count: s.count }))}
                getLabel={(s) => lo.legal.disputeStatus[s]}
                getTone={(s) => DISPUTE_STATUS_TONE[s]}
              />
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard className="p-5 sm:p-6">
              <h3 className="mb-4 font-serif text-base font-semibold text-[var(--text-strong)]">
                {D.cases.moneyComparisonLak}
              </h3>
              <BarList
                accent="litigation"
                data={[
                  { key: 'damage', label: F.damage, value: state.record.lak.damage },
                  { key: 'fine', label: F.fine, value: state.record.lak.fine },
                  { key: 'recovered', label: F.recovered, value: state.record.lak.recovered },
                ]}
              />
            </GlassCard>
            <GlassCard className="p-5 sm:p-6">
              <h3 className="mb-4 font-serif text-base font-semibold text-[var(--text-strong)]">
                {D.cases.moneyComparisonUsd}
              </h3>
              <BarList
                accent="litigation"
                data={[
                  { key: 'damage', label: F.damage, value: state.record.usd.damage },
                  { key: 'fine', label: F.fine, value: state.record.usd.fine },
                  { key: 'recovered', label: F.recovered, value: state.record.usd.recovered },
                ]}
              />
            </GlassCard>
          </div>
        </>
      ) : null}
    </section>
  );
}
