'use client';

import { ArrowRight, BookOpen, Building2, FileText } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { BarList } from '@/components/charts/bar-list';
import { AlertBanner } from '@/components/shared/alert-banner';
import { EmptyState } from '@/components/shared/empty-state';
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
import { formatNumber } from '@/lib/utils/number';
import { SectionHeader, SectionSkeleton } from '../../lib/section-header';
import { useRecord } from '../../lib/use-record';
import { legalDocumentsService } from '../api/legal-documents.service';

const D = lo.legal.dashboard;

const fetchDashboard = () => legalDocumentsService.dashboard();

export function LegalDocumentsDashboardSection() {
  const { state, retry } = useRecord('dashboard', fetchDashboard);

  const stats = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const { total, active, inactive, byType, byDepartment } = state.record;
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;
    const sortedTypes = [...byType]
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count);
    const sortedDepts = [...byDepartment]
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      total,
      active,
      inactive,
      activeRate,
      sortedTypes,
      sortedDepts,
    };
  }, [state]);

  return (
    <TooltipProvider delayDuration={150}>
      <section aria-labelledby="dashboard-regulations-heading" className="flex flex-col gap-5">
        <SectionHeader
          id="dashboard-regulations-heading"
          icon={BookOpen}
          title={D.regulationsSection}
          accent="legal"
          href="/legal/regulations"
          linkLabel={D.viewAllRegulations}
        />

        {state.kind === 'loading' ? <SectionSkeleton testId="legal-documents-dashboard-skeleton" /> : null}

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

        {state.kind === 'ready' && stats ? (
          <>
            {/* KPI Metrics with Progressive Hover Detail Popups */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <KpiCard
                      index={0}
                      label={D.regulations.total}
                      value={formatNumber(stats.total)}
                      delta={{
                        text: `${stats.sortedTypes.length} ປະເພດນິຕິກຳໃນລະບົບ`,
                        positive: undefined,
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="flex flex-col gap-1.5 p-3 text-xs bg-popover text-popover-foreground border border-border shadow-xl">
                  <p className="font-semibold text-[var(--text-strong)] border-b border-[var(--border-subtle)] pb-1">
                    ພາບລວມນິຕິກຳທັງໝົດ ({stats.total} ສະບັບ):
                  </p>
                  <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                    <span>• ຍັງມີຜົນບັງຄັບໃຊ້:</span>
                    <span className="font-mono font-medium text-[var(--text-strong)]">
                      {stats.active} ສະບັບ ({stats.activeRate}%)
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                    <span>• ຍົກເລີກ / ບໍ່ໄດ້ໃຊ້:</span>
                    <span className="font-mono font-medium text-[var(--text-strong)]">
                      {stats.inactive} ສະບັບ ({100 - stats.activeRate}%)
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <KpiCard
                      index={1}
                      label={D.regulations.active}
                      value={formatNumber(stats.active)}
                      variant="info"
                      delta={{
                        text: `${stats.activeRate}% ຍັງມີຜົນບັງຄັບໃຊ້`,
                        positive: true,
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="flex flex-col gap-1.5 p-3 text-xs bg-popover text-popover-foreground border border-border shadow-xl">
                  <p className="font-semibold text-[var(--text-strong)] border-b border-[var(--border-subtle)] pb-1">
                    ນິຕິກຳທີ່ມີຜົນບັງຄັບໃຊ້:
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    ເອກະສານນິຕິກຳ, ຂໍ້ກຳນົດ, ລະບຽບການ ແລະ ແຈ້ງການທີ່ຍັງມີຜົນບັງຄັບໃຊ້ຢ່າງເປັນທາງການໃນປັດຈຸບັນ.
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <KpiCard
                      index={2}
                      label={D.regulations.inactive}
                      value={formatNumber(stats.inactive)}
                      variant="default"
                      delta={{
                        text: `${100 - stats.activeRate}% ຍົກເລີກ ຫຼື ໝົດອາຍຸ`,
                        positive: stats.inactive > 0 ? false : undefined,
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="flex flex-col gap-1.5 p-3 text-xs bg-popover text-popover-foreground border border-border shadow-xl">
                  <p className="font-semibold text-[var(--text-strong)] border-b border-[var(--border-subtle)] pb-1">
                    ນິຕິກຳທີ່ໝົດອາຍຸ/ຍົກເລີກ:
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    ເອກະສານທີ່ຖືກແທນທີ່ດ້ວຍສະບັບໃໝ່ ຫຼື ຖືກຍົກເລີກການນຳໃຊ້ຕາມການເວລາ.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Charts & Breakdown */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <GlassCard className="flex flex-col justify-between p-5 sm:p-6">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-[var(--legal)]" aria-hidden="true" />
                      <h3 className="font-serif text-base font-semibold text-[var(--text-strong)]">
                        {D.regulations.byType}
                      </h3>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {stats.sortedTypes.length} ປະເພດ
                    </span>
                  </div>

                  {stats.sortedTypes.length === 0 ? (
                    <EmptyState
                      title="ຍັງບໍ່ມີຂໍ້ມູນປະເພດນິຕິກຳ"
                      description="ເມື່ອມີການບັນທຶກນິຕິກຳ ລະບົບຈະສະແດງການແບ່ງກຸ່ມຕາມປະເພດຢູ່ນີ້"
                    />
                  ) : (
                    <BarList
                      accent="legal"
                      data={stats.sortedTypes.map((t) => ({
                        key: t.docType,
                        label: lo.legal.docTypes[t.docType] || t.docType,
                        value: t.count,
                        subValue: stats.total > 0 ? `${Math.round((t.count / stats.total) * 100)}%` : undefined,
                      }))}
                    />
                  )}
                </div>

                <div className="mt-5 border-t border-[var(--border-subtle)] pt-3 text-right">
                  <Link
                    href="/legal/regulations"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--legal)] transition-colors"
                  >
                    <span>ຄົ້ນຫານິຕິກຳຕາມປະເພດ</span>
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                </div>
              </GlassCard>

              <GlassCard className="flex flex-col justify-between p-5 sm:p-6">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-[var(--legal)]" aria-hidden="true" />
                      <h3 className="font-serif text-base font-semibold text-[var(--text-strong)]">
                        {D.regulations.byDepartment}
                      </h3>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {stats.sortedDepts.length} ຫ້ອງການ/ຝ່າຍ
                    </span>
                  </div>

                  {stats.sortedDepts.length === 0 ? (
                    <EmptyState
                      title="ຍັງບໍ່ມີຂໍ້ມູນຫ້ອງການ/ຝ່າຍ"
                      description="ເມື່ອມີການກຳນົດຫ້ອງການທີ່ຮັບຜິດຊອບ ລະບົບຈະສະແດງສະຖິຕິຢູ່ນີ້"
                    />
                  ) : (
                    <BarList
                      accent="legal"
                      data={stats.sortedDepts.slice(0, 10).map((d) => ({
                        key: d.departmentId,
                        label: d.name,
                        value: d.count,
                        subValue: stats.total > 0 ? `${Math.round((d.count / stats.total) * 100)}%` : undefined,
                      }))}
                    />
                  )}
                </div>

                <div className="mt-5 border-t border-[var(--border-subtle)] pt-3 text-right">
                  <Link
                    href="/legal/regulations"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--legal)] transition-colors"
                  >
                    <span>ເບິ່ງການແບ່ງຕາມຫ້ອງການທັງໝົດ</span>
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                </div>
              </GlassCard>
            </div>
          </>
        ) : null}
      </section>
    </TooltipProvider>
  );
}
