'use client';

import { BookOpen } from 'lucide-react';
import { BarList } from '@/components/charts/bar-list';
import { AlertBanner } from '@/components/shared/alert-banner';
import { GlassCard } from '@/components/shared/glass-card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Button } from '@/components/ui/button';
import { toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { SectionHeader, SectionSkeleton } from '../../lib/section-header';
import { useRecord } from '../../lib/use-record';
import { legalDocumentsService } from '../api/legal-documents.service';

const D = lo.legal.dashboard;

const fetchDashboard = () => legalDocumentsService.dashboard();

/** Dashboard block for legal documents: totals, active/inactive, by type, by department. */
export function LegalDocumentsDashboardSection() {
  const { state, retry } = useRecord('dashboard', fetchDashboard);

  return (
    <section aria-labelledby="dashboard-regulations-heading" className="flex flex-col gap-4">
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
      {state.kind === 'ready' ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard label={D.regulations.total} value={state.record.total} />
            <KpiCard label={D.regulations.active} value={state.record.active} />
            <KpiCard label={D.regulations.inactive} value={state.record.inactive} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard className="p-5 sm:p-6">
              <h3 className="mb-4 font-serif text-base font-semibold text-[var(--text-strong)]">
                {D.regulations.byType}
              </h3>
              <BarList
                accent="legal"
                data={state.record.byType.map((t) => ({
                  key: t.docType,
                  label: lo.legal.docTypes[t.docType],
                  value: t.count,
                }))}
              />
            </GlassCard>
            <GlassCard className="p-5 sm:p-6">
              <h3 className="mb-4 font-serif text-base font-semibold text-[var(--text-strong)]">
                {D.regulations.byDepartment}
              </h3>
              <BarList
                accent="legal"
                data={state.record.byDepartment.slice(0, 12).map((d) => ({
                  key: d.departmentId,
                  label: d.name,
                  value: d.count,
                }))}
              />
            </GlassCard>
          </div>
        </>
      ) : null}
    </section>
  );
}
