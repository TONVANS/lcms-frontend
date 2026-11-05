'use client';

import {
  ArrowRight,
  Clock,
  Info,
  Scale,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { BarList } from '@/components/charts/bar-list';
import { StackedStatusBar } from '@/components/charts/stacked-status-bar';
import { AlertBanner } from '@/components/shared/alert-banner';
import { GlassCard } from '@/components/shared/glass-card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/number';
import { SectionHeader, SectionSkeleton } from '../../lib/section-header';
import { useRecord } from '../../lib/use-record';
import { legalCasesService } from '../api/legal-cases.service';
import { DISPUTE_STATUS_TONE, type DisputeStatus } from '../types';

const D = lo.legal.dashboard;
const F = lo.legal.fields;

const fetchDashboard = () => legalCasesService.dashboard();

type CurrencyKey = 'lak' | 'usd';

export function LegalCasesDashboardSection() {
  const { state, retry } = useRecord('dashboard', fetchDashboard);
  const [currency, setCurrency] = useState<CurrencyKey>('lak');

  const computed = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const { total, byDisputeStatus, lak, usd } = state.record;

    const activeStatuses: DisputeStatus[] = ['FIRST_INSTANCE', 'APPEAL', 'SUPREME'];
    const firstInstanceCount = byDisputeStatus.find((s) => s.status === 'FIRST_INSTANCE')?.count ?? 0;
    const appealCount = byDisputeStatus.find((s) => s.status === 'APPEAL')?.count ?? 0;
    const supremeCount = byDisputeStatus.find((s) => s.status === 'SUPREME')?.count ?? 0;
    const resolvedCount = byDisputeStatus.find((s) => s.status === 'RESOLVED')?.count ?? 0;
    const closedCount = byDisputeStatus.find((s) => s.status === 'CLOSED')?.count ?? 0;

    const activeCount = firstInstanceCount + appealCount + supremeCount;
    const completedCount = resolvedCount + closedCount;

    const resolutionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    const activeRate = total > 0 ? Math.round((activeCount / total) * 100) : 0;

    const activeMoney = currency === 'lak' ? lak : usd;
    const otherMoney = currency === 'lak' ? usd : lak;
    const otherCurrencyKey = currency === 'lak' ? 'USD' : 'LAK';

    const recoveryRate =
      activeMoney.totalDue > 0
        ? Math.min(100, Math.round((activeMoney.recovered / activeMoney.totalDue) * 100))
        : activeMoney.recovered > 0
          ? 100
          : 0;

    const outstanding = Math.max(0, activeMoney.totalDue - activeMoney.recovered);

    const otherRecoveryRate =
      otherMoney.totalDue > 0
        ? Math.min(100, Math.round((otherMoney.recovered / otherMoney.totalDue) * 100))
        : otherMoney.recovered > 0
          ? 100
          : 0;

    return {
      total,
      byDisputeStatus,
      firstInstanceCount,
      appealCount,
      supremeCount,
      resolvedCount,
      closedCount,
      activeCount,
      completedCount,
      resolutionRate,
      activeRate,
      activeMoney,
      otherMoney,
      otherCurrencyKey,
      recoveryRate,
      otherRecoveryRate,
      outstanding,
      lak,
      usd,
    };
  }, [state, currency]);

  return (
    <TooltipProvider delayDuration={150}>
      <section aria-labelledby="dashboard-cases-heading" className="flex flex-col gap-5">
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

        {state.kind === 'ready' && computed ? (
          <>
            {/* 3 Clean KPI Cards with Progressive Hover Tooltips */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <KpiCard
                      index={0}
                      label={D.cases.total}
                      value={formatNumber(computed.total)}
                      delta={{
                        text: 'ສຳນວນຄະດີທັງໝົດໃນລະບົບ (ຊີ້ເພື່ອເບິ່ງຍ່ອຍ)',
                        positive: undefined,
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="flex flex-col gap-1.5 p-3 text-xs bg-popover text-popover-foreground border border-border shadow-xl">
                  <p className="font-semibold text-[var(--text-strong)] border-b border-[var(--border-subtle)] pb-1">
                    ສະຫຼຸບສະຖານະຄະດີທັງໝົດ ({computed.total} ຄະດີ):
                  </p>
                  <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                    <span>• ກຳລັງດຳເນີນຄະດີ:</span>
                    <span className="font-mono font-medium text-[var(--text-strong)]">
                      {computed.activeCount} ຄະດີ ({computed.activeRate}%)
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                    <span>• ສຳເລັດ / ຈົບຄະດີແລ້ວ:</span>
                    <span className="font-mono font-medium text-[var(--text-strong)]">
                      {computed.completedCount} ຄະດີ ({computed.resolutionRate}%)
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <KpiCard
                      index={1}
                      label="ກຳລັງດຳເນີນຄະດີ"
                      value={formatNumber(computed.activeCount)}
                      variant="warning"
                      delta={{
                        text: `${computed.activeRate}% ຢູ່ໃນຂັ້ນຕອນສານ`,
                        positive: computed.activeCount === 0 ? true : undefined,
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="flex flex-col gap-1.5 p-3 text-xs bg-popover text-popover-foreground border border-border shadow-xl">
                  <p className="font-semibold text-[var(--text-strong)] border-b border-[var(--border-subtle)] pb-1">
                    ແຍກຕາມຂັ້ນຕອນສານ:
                  </p>
                  <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                    <span>• ສານຂັ້ນຕົ້ນ:</span>
                    <span className="font-mono font-medium text-[var(--text-strong)]">
                      {computed.firstInstanceCount} ຄະດີ
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                    <span>• ສານຂັ້ນອຸທອນ:</span>
                    <span className="font-mono font-medium text-[var(--text-strong)]">
                      {computed.appealCount} ຄະດີ
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                    <span>• ຂັ້ນລົບລ້າງ (ສານສູງສຸດ):</span>
                    <span className="font-mono font-medium text-[var(--text-strong)]">
                      {computed.supremeCount} ຄະດີ
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <KpiCard
                      index={2}
                      label="ສຳເລັດ / ຈົບຄະດີ"
                      value={formatNumber(computed.completedCount)}
                      variant="info"
                      delta={{
                        text: `${computed.resolutionRate}% ປິດສຳນວນຄະດີແລ້ວ`,
                        positive: true,
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="flex flex-col gap-1.5 p-3 text-xs bg-popover text-popover-foreground border border-border shadow-xl">
                  <p className="font-semibold text-[var(--text-strong)] border-b border-[var(--border-subtle)] pb-1">
                    ລາຍລະອຽດການປິດຄະດີ:
                  </p>
                  <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                    <span>• ສຳເລັດ (Resolved):</span>
                    <span className="font-mono font-medium text-[var(--text-strong)]">
                      {computed.resolvedCount} ຄະດີ
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                    <span>• ຈົບຄະດີ (Closed):</span>
                    <span className="font-mono font-medium text-[var(--text-strong)]">
                      {computed.closedCount} ຄະດີ
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                    ອັດຕາຄວາມສຳເລັດຄິດໄລ່ຈາກສຳນວນຄະດີທີ່ສິ້ນສຸດທຽບກັບທັງໝົດ
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Clean Court Dispute Stages Timeline */}
            <GlassCard className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-[var(--litigation)]" aria-hidden="true" />
                  <h3 className="font-serif text-base font-semibold text-[var(--text-strong)]">
                    {D.cases.byStatus}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <span>ຄວາມຄືບໜ້າ:</span>
                  <span className="font-semibold tabular-nums text-[var(--text-strong)]">
                    {computed.resolutionRate}%
                  </span>
                </div>
              </div>

              {/* Minimalist Stacked Bar */}
              <div data-testid="cases-stage-bar" className="py-2">
                <StackedStatusBar
                  data={computed.byDisputeStatus.map((s) => ({ status: s.status, count: s.count }))}
                  getLabel={(s) => lo.legal.disputeStatus[s]}
                  getTone={(s) => DISPUTE_STATUS_TONE[s]}
                />
              </div>

              <p className="mt-2 text-[11px] text-[var(--text-muted)] text-right">
                * ຊີ້ເມົ້າໃສ່ແຕ່ລະຂັ້ນຕອນເພື່ອເບິ່ງລາຍລະອຽດ
              </p>
            </GlassCard>

            {/* Financial Claims & Recovery Analysis */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 pt-1">
                <h3 className="font-serif text-base font-semibold text-[var(--text-strong)]">
                  ມູນຄ່າ ແລະ ການເກັບກູ້ຄືນ
                </h3>

                {/* Minimalist Currency Pill */}
                <div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCurrency('lak')}
                    className={cn(
                      'rounded-md px-3 py-1 font-medium transition-all cursor-pointer',
                      currency === 'lak'
                        ? 'bg-[var(--surface-glass)] text-[var(--text-strong)] shadow-xs font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]',
                    )}
                  >
                    LAK (ກີບ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('usd')}
                    className={cn(
                      'rounded-md px-3 py-1 font-medium transition-all cursor-pointer',
                      currency === 'usd'
                        ? 'bg-[var(--surface-glass)] text-[var(--text-strong)] shadow-xs font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]',
                    )}
                  >
                    USD (ໂດລາ)
                  </button>
                </div>
              </div>

              {/* 2 Clean Primary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Card 1: Total Due / Claim with Hover Detail Pop */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <GlassCard className="p-5 sm:p-6 transition-all duration-200 hover:border-[var(--litigation)]/30">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-[var(--text-muted)]">
                            {currency === 'lak' ? D.cases.totalDueLak : D.cases.totalDueUsd}
                          </span>
                          <Info className="size-3.5 text-[var(--text-muted)] opacity-60" aria-hidden="true" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-[32px] font-semibold tracking-tight tabular-nums text-[var(--text-strong)]">
                            {formatNumber(computed.activeMoney.totalDue)}
                          </span>
                          <span className="text-xs font-medium text-[var(--text-muted)]">
                            {currency.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          ລວມຍອດຄ່າເສຍຫາຍ ແລະ ຄ່າປັບໄໝທັງໝົດ (ຊີ້ເພື່ອເບິ່ງຍ່ອຍ)
                        </p>
                      </GlassCard>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="flex flex-col gap-1.5 p-3 text-xs bg-popover text-popover-foreground border border-border shadow-xl">
                    <p className="font-semibold text-[var(--text-strong)] border-b border-[var(--border-subtle)] pb-1">
                      ແຍກຍອດ {currency.toUpperCase()}:
                    </p>
                    <div className="flex justify-between gap-6 text-[var(--text-secondary)]">
                      <span>• {F.damage} (ຄ່າເສຍຫາຍ):</span>
                      <span className="font-mono font-medium text-[var(--text-strong)]">
                        {formatNumber(computed.activeMoney.damage)} {currency.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between gap-6 text-[var(--text-secondary)]">
                      <span>• {F.fine} (ຄ່າປັບໄໝ):</span>
                      <span className="font-mono font-medium text-[var(--text-strong)]">
                        {formatNumber(computed.activeMoney.fine)} {currency.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between gap-6 text-[var(--text-strong)] font-semibold border-t border-[var(--border-subtle)] pt-1">
                      <span>= ລວມຍອດຮຽກຮ້ອງ:</span>
                      <span className="font-mono">
                        {formatNumber(computed.activeMoney.totalDue)} {currency.toUpperCase()}
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Card 2: Recovered Amount & Progress with Hover Detail Pop */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <GlassCard className="p-5 sm:p-6 transition-all duration-200 hover:border-emerald-500/30">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-[var(--text-muted)]">
                            {currency === 'lak' ? D.cases.recoveredLak : D.cases.recoveredUsd}
                          </span>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            ເກັບຄືນໄດ້ {computed.recoveryRate}%
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-[32px] font-semibold tracking-tight tabular-nums text-[var(--text-strong)]">
                            {formatNumber(computed.activeMoney.recovered)}
                          </span>
                          <span className="text-xs font-medium text-[var(--text-muted)]">
                            {currency.toUpperCase()}
                          </span>
                        </div>

                        {/* Subtle Progress Track */}
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-inset)]">
                          <div
                            className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-300"
                            style={{ width: `${computed.recoveryRate}%` }}
                          />
                        </div>
                      </GlassCard>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="flex flex-col gap-1.5 p-3 text-xs bg-popover text-popover-foreground border border-border shadow-xl">
                    <p className="font-semibold text-[var(--text-strong)] border-b border-[var(--border-subtle)] pb-1">
                      ລາຍລະອຽດການເກັບກູ້ຄືນ ({currency.toUpperCase()}):
                    </p>
                    <div className="flex justify-between gap-6 text-[var(--text-secondary)]">
                      <span>• ມູນຄ່າເກັບກູ້ໄດ້:</span>
                      <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {formatNumber(computed.activeMoney.recovered)} {currency.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between gap-6 text-[var(--text-secondary)]">
                      <span>• ຍອດຄ້າງຊຳລະ:</span>
                      <span className="font-mono font-medium text-[var(--text-strong)]">
                        {formatNumber(computed.outstanding)} {currency.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                      ອັດຕາການເກັບຄືນ = {computed.recoveryRate}% ຂອງຍອດຮຽກຮ້ອງ
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Focused Comparison Chart for Selected Currency */}
              <GlassCard className="p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif text-base font-semibold text-[var(--text-strong)]">
                    ປຽບທຽບມູນຄ່າ ({currency.toUpperCase()})
                  </h3>
                  <span className="text-xs text-[var(--text-muted)]">
                    ຄ່າເສຍຫາຍ vs ຄ່າປັບໄໝ vs ເກັບຄືນໄດ້
                  </span>
                </div>

                <BarList
                  accent="litigation"
                  valueFormatter={(val) => `${formatNumber(val)} ${currency.toUpperCase()}`}
                  data={[
                    { key: 'damage', label: F.damage, value: computed.activeMoney.damage },
                    { key: 'fine', label: F.fine, value: computed.activeMoney.fine },
                    { key: 'recovered', label: F.recovered, value: computed.activeMoney.recovered },
                  ]}
                />

                {/* Subtle Other Currency Quick Peek with Hover Pop */}
                <div className="mt-5 border-t border-[var(--border-subtle)] pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                  <span>
                    ສະຫຼຸບສະກຸນເງິນ {computed.otherCurrencyKey}:
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setCurrency(currency === 'lak' ? 'usd' : 'lak')}
                        className="inline-flex items-center gap-1.5 font-medium text-[var(--text-secondary)] hover:text-[var(--text-strong)] transition-colors cursor-pointer"
                      >
                        <span>
                          ຍອດລວມ {formatNumber(computed.otherMoney.totalDue)} {computed.otherCurrencyKey} (ເກັບໄດ້ {computed.otherRecoveryRate}%)
                        </span>
                        <ArrowRight className="size-3" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs bg-popover text-popover-foreground border border-border p-2.5 shadow-xl">
                      ກົດເພື່ອສະຫຼັບໄປເບິ່ງສະກຸນເງິນ {computed.otherCurrencyKey}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </GlassCard>
            </div>
          </>
        ) : null}
      </section>
    </TooltipProvider>
  );
}
